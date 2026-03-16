import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import QRCode from 'qrcode';
import { all, get, initDb, run } from './db.js';
import { authRequired, roleRequired, signToken } from './auth.js';
import { createQrToken, distanceMeters } from './utils.js';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !['teacher', 'student'].includes(role)) {
      res.status(400).json({ message: 'Invalid payload' });
      return;
    }

    const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      res.status(409).json({ message: 'Email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await run('INSERT INTO users(name, email, password_hash, role) VALUES (?, ?, ?, ?)', [
      name,
      email,
      passwordHash,
      role
    ]);

    const token = signToken({ id: result.id, email, role, name });
    res.status(201).json({ token, user: { id: result.id, name, email, role } });
  } catch (error) {
    res.status(500).json({ message: 'Could not register', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Could not login', error: error.message });
  }
});

app.get('/api/me', authRequired, async (req, res) => {
  const user = await get('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
  res.json({ user });
});

app.post('/api/courses', authRequired, roleRequired('teacher'), async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) {
    res.status(400).json({ message: 'name and code required' });
    return;
  }

  try {
    const result = await run('INSERT INTO courses(name, code, teacher_id) VALUES (?, ?, ?)', [
      name,
      code,
      req.user.id
    ]);
    const course = await get('SELECT * FROM courses WHERE id = ?', [result.id]);
    res.status(201).json({ course });
  } catch (error) {
    res.status(409).json({ message: 'Course code already in use', error: error.message });
  }
});

app.get('/api/courses', authRequired, async (req, res) => {
  if (req.user.role === 'teacher') {
    const courses = await all('SELECT * FROM courses WHERE teacher_id = ? ORDER BY created_at DESC', [
      req.user.id
    ]);
    res.json({ courses });
    return;
  }

  const courses = await all(
    `SELECT c.* FROM courses c
      INNER JOIN enrollments e ON c.id = e.course_id
      WHERE e.student_id = ?
      ORDER BY c.created_at DESC`,
    [req.user.id]
  );
  res.json({ courses });
});

app.post('/api/courses/:courseId/enroll', authRequired, roleRequired('student'), async (req, res) => {
  const courseId = Number(req.params.courseId);
  const course = await get('SELECT id FROM courses WHERE id = ?', [courseId]);
  if (!course) {
    res.status(404).json({ message: 'Course not found' });
    return;
  }
  try {
    await run('INSERT INTO enrollments(course_id, student_id) VALUES (?, ?)', [courseId, req.user.id]);
    res.status(201).json({ message: 'Enrolled successfully' });
  } catch {
    res.status(200).json({ message: 'Already enrolled' });
  }
});

app.post('/api/sessions', authRequired, roleRequired('teacher'), async (req, res) => {
  const { courseId, title, latitude, longitude, radiusMeters, expiresInMinutes = 15 } = req.body;

  if (!courseId || !title || latitude == null || longitude == null || !radiusMeters) {
    res.status(400).json({ message: 'Invalid payload' });
    return;
  }

  const course = await get('SELECT * FROM courses WHERE id = ? AND teacher_id = ?', [courseId, req.user.id]);

  if (!course) {
    res.status(404).json({ message: 'Course not found for this teacher' });
    return;
  }

  const qrToken = createQrToken();
  const expiresAt = new Date(Date.now() + Number(expiresInMinutes) * 60000).toISOString();

  const result = await run(
    `INSERT INTO sessions(course_id, title, qr_token, latitude, longitude, radius_meters, expires_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [courseId, title, qrToken, latitude, longitude, radiusMeters, expiresAt, req.user.id]
  );

  const qrPayload = JSON.stringify({ token: qrToken, sessionId: result.id });
  const qrDataUrl = await QRCode.toDataURL(qrPayload);

  res.status(201).json({
    session: {
      id: result.id,
      title,
      qrToken,
      latitude,
      longitude,
      radiusMeters,
      expiresAt,
      qrDataUrl
    }
  });
});

app.get('/api/sessions/:sessionId/attendance', authRequired, roleRequired('teacher'), async (req, res) => {
  const sessionId = Number(req.params.sessionId);
  const rows = await all(
    `SELECT a.*, u.name, u.email
      FROM attendances a
      JOIN users u ON u.id = a.student_id
      JOIN sessions s ON s.id = a.session_id
      WHERE a.session_id = ? AND s.created_by = ?
      ORDER BY a.scanned_at DESC`,
    [sessionId, req.user.id]
  );
  res.json({ records: rows });
});

app.post('/api/attendance/scan', authRequired, roleRequired('student'), async (req, res) => {
  const { qrToken, latitude, longitude } = req.body;

  if (!qrToken || latitude == null || longitude == null) {
    res.status(400).json({ message: 'qrToken, latitude, longitude required' });
    return;
  }

  const session = await get('SELECT * FROM sessions WHERE qr_token = ?', [qrToken]);

  if (!session) {
    res.status(404).json({ message: 'Invalid QR code' });
    return;
  }

  if (new Date(session.expires_at).getTime() < Date.now()) {
    res.status(410).json({ message: 'Session expired' });
    return;
  }

  const enrolled = await get('SELECT id FROM enrollments WHERE course_id = ? AND student_id = ?', [
    session.course_id,
    req.user.id
  ]);
  if (!enrolled) {
    res.status(403).json({ message: 'You are not enrolled in this course' });
    return;
  }

  const distance = distanceMeters(session.latitude, session.longitude, latitude, longitude);

  if (distance > session.radius_meters) {
    res.status(403).json({
      message: 'Outside allowed location radius',
      allowedRadius: session.radius_meters,
      yourDistance: Math.round(distance)
    });
    return;
  }

  try {
    await run(
      'INSERT INTO attendances(session_id, student_id, distance_meters, location_lat, location_lon) VALUES (?, ?, ?, ?, ?)',
      [session.id, req.user.id, distance, latitude, longitude]
    );
    res.status(201).json({ message: 'Attendance marked', distanceMeters: Math.round(distance) });
  } catch {
    res.status(200).json({ message: 'Attendance already recorded' });
  }
});

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('DB init failed', error);
    process.exit(1);
  });
