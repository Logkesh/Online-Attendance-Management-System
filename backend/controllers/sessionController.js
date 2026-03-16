import crypto from 'crypto';
import QRCode from 'qrcode';
import { dbAsync } from '../config/db.js';

const isActiveSession = (session) => {
  const now = new Date();
  const start = new Date(`${session.date}T${session.starttime}`);
  const end = new Date(`${session.date}T${session.endtime}`);
  return now >= start && now <= end;
};

export const createSession = async (req, res) => {
  const { subject_id, class_id, faculty_id, starttime, endtime, date, faculty_lat, faculty_lng, allowed_radius_m = 100 } = req.body;

  if (!subject_id || !class_id || !faculty_id || !starttime || !endtime || !date) {
    return res.status(400).json({ message: 'All session fields are required' });
  }

  if (faculty_lat == null || faculty_lng == null) {
    return res.status(400).json({ message: 'Faculty location is required to start session' });
  }

  const session_id = crypto.randomUUID();
  const qrPayload = {
    session_id,
    class_id,
    subject_id,
    faculty_id,
    date,
    type: 'attendance-session'
  };

  const qrcode = JSON.stringify(qrPayload);
  const qr_image = await QRCode.toDataURL(qrcode);

  await dbAsync.run(
    `INSERT INTO CLASS_SESSION (session_id, qrcode, qr_image, subject_id, class_id, faculty_id, starttime, endtime, date, faculty_lat, faculty_lng, allowed_radius_m)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [session_id, qrcode, qr_image, subject_id, class_id, faculty_id, starttime, endtime, date, faculty_lat, faculty_lng, allowed_radius_m]
  );

  await dbAsync.run(
    'UPDATE FACULTY_TO_CLASS SET noofclasseshappnd = noofclasseshappnd + 1 WHERE faculty_id = ? AND class_id = ? AND sub_id = ?',
    [faculty_id, class_id, subject_id]
  );

  return res.status(201).json({
    session_id,
    qrcode,
    qr_image,
    class_id,
    subject_id,
    faculty_id,
    starttime,
    endtime,
    date,
    allowed_radius_m
  });
};

export const validateSession = async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ message: 'session_id is required' });

  const session = await dbAsync.get('SELECT * FROM CLASS_SESSION WHERE session_id = ?', [session_id]);
  if (!session) return res.status(404).json({ message: 'Session not found' });

  if (!isActiveSession(session)) {
    return res.status(400).json({ message: 'Session is not active' });
  }

  return res.json({ valid: true, session });
};

export const facultySessions = async (req, res) => {
  const { faculty_id } = req.params;
  const sessions = await dbAsync.all(
    `SELECT cs.*, c.class_name, s.sub_name, COUNT(a.student_id) AS present_count
     FROM CLASS_SESSION cs
     LEFT JOIN CLASS c ON c.class_id = cs.class_id
     LEFT JOIN SUBJECT s ON s.sub_id = cs.subject_id
     LEFT JOIN ATTENDANCE a ON a.session_id = cs.session_id
     WHERE cs.faculty_id = ?
     GROUP BY cs.session_id
     ORDER BY cs.date DESC, cs.starttime DESC`,
    [faculty_id]
  );

  const summaryBySubject = sessions.reduce((acc, item) => {
    const key = item.sub_name ?? `Subject ${item.subject_id}`;
    if (!acc[key]) acc[key] = { sessions: 0, present: 0 };
    acc[key].sessions += 1;
    acc[key].present += Number(item.present_count || 0);
    return acc;
  }, {});

  return res.json({
    sessions,
    cards: {
      totalClasses: sessions.length,
      presentCount: sessions.reduce((sum, item) => sum + Number(item.present_count || 0), 0)
    },
    subjectSummary: summaryBySubject
  });
};
