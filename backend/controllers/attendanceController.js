import { dbAsync } from '../config/db.js';

const isActiveSession = (session) => {
  const now = new Date();
  const start = new Date(`${session.date}T${session.starttime}`);
  const end = new Date(`${session.date}T${session.endtime}`);
  return now >= start && now <= end;
};

const toRad = (value) => (value * Math.PI) / 180;

const getDistanceMeters = (lat1, lng1, lat2, lng2) => {
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

export const markAttendance = async (req, res) => {
  const { session_id, student_id, student_lat, student_lng } = req.body;

  if (!session_id || !student_id) {
    return res.status(400).json({ message: 'session_id and student_id are required' });
  }

  const isFacultyManual = req.user?.role === 'faculty';
  if (!isFacultyManual && (student_lat == null || student_lng == null)) {
    return res.status(400).json({ message: 'Student location is required while scanning QR' });
  }

  const session = await dbAsync.get('SELECT * FROM CLASS_SESSION WHERE session_id = ?', [session_id]);
  if (!session) return res.status(404).json({ message: 'Session not found' });

  if (!isActiveSession(session)) return res.status(400).json({ message: 'Session is not active' });

  const student = await dbAsync.get('SELECT * FROM STUDENT WHERE student_id = ?', [student_id]);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  if (student.student_class_id !== session.class_id) {
    return res.status(400).json({ message: 'Student does not belong to this class' });
  }

  if (!isFacultyManual) {
    const distance = getDistanceMeters(Number(student_lat), Number(student_lng), Number(session.faculty_lat), Number(session.faculty_lng));
    if (distance > Number(session.allowed_radius_m || 100)) {
      return res.status(400).json({ message: 'Outside allowed location range' });
    }
  }

  const existing = await dbAsync.get(
    'SELECT * FROM ATTENDANCE WHERE session_id = ? AND student_id = ?',
    [session_id, student_id]
  );

  if (existing) return res.status(409).json({ message: 'Attendance already marked' });

  const now = new Date();
  await dbAsync.run('INSERT INTO ATTENDANCE (session_id, student_id, time, date) VALUES (?, ?, ?, ?)', [
    session_id,
    student_id,
    now.toTimeString().slice(0, 8),
    now.toISOString().slice(0, 10)
  ]);

  return res.status(201).json({ message: 'Attendance marked successfully' });
};

export const studentsByClass = async (req, res) => {
  const { class_id } = req.params;
  const students = await dbAsync.all(
    'SELECT student_id, stud_name, stud_username FROM STUDENT WHERE student_class_id = ? ORDER BY stud_name',
    [class_id]
  );
  return res.json(students);
};

export const studentAttendanceHistory = async (req, res) => {
  const { student_id } = req.params;

  const student = await dbAsync.get('SELECT student_class_id FROM STUDENT WHERE student_id = ?', [student_id]);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const records = await dbAsync.all(
    `SELECT a.*, cs.subject_id, cs.class_id, s.sub_name, c.class_name
     FROM ATTENDANCE a
     JOIN CLASS_SESSION cs ON cs.session_id = a.session_id
     LEFT JOIN SUBJECT s ON s.sub_id = cs.subject_id
     LEFT JOIN CLASS c ON c.class_id = cs.class_id
     WHERE a.student_id = ?
     ORDER BY a.date DESC, a.time DESC`,
    [student_id]
  );

  const classTotalSessions = await dbAsync.get('SELECT COUNT(*) AS total FROM CLASS_SESSION WHERE class_id = ?', [student.student_class_id]);

  const subjectSummaryRows = await dbAsync.all(
    `SELECT s.sub_name, cs.subject_id,
      COUNT(DISTINCT cs.session_id) AS total_sessions,
      COUNT(DISTINCT a.session_id) AS present_sessions
     FROM CLASS_SESSION cs
     LEFT JOIN SUBJECT s ON s.sub_id = cs.subject_id
     LEFT JOIN ATTENDANCE a ON a.session_id = cs.session_id AND a.student_id = ?
     WHERE cs.class_id = ?
     GROUP BY cs.subject_id, s.sub_name`,
    [student_id, student.student_class_id]
  );

  return res.json({
    records,
    summary: {
      totalSessions: Number(classTotalSessions?.total || 0),
      presentSessions: records.length,
      overallPercentage:
        Number(classTotalSessions?.total || 0) > 0
          ? Number(((records.length / Number(classTotalSessions.total)) * 100).toFixed(1))
          : 0,
      subjects: subjectSummaryRows
    }
  });
};
