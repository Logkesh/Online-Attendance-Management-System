import { dbAsync } from '../config/db.js';

const isActiveSession = (session) => {
  const now = new Date();
  const start = new Date(`${session.date}T${session.starttime}`);
  const end = new Date(`${session.date}T${session.endtime}`);
  return now >= start && now <= end;
};

export const markAttendance = async (req, res) => {
  const { session_id, student_id } = req.body;

  if (!session_id || !student_id) {
    return res.status(400).json({ message: 'session_id and student_id are required' });
  }

  const session = await dbAsync.get('SELECT * FROM CLASS_SESSION WHERE session_id = ?', [session_id]);
  if (!session) return res.status(404).json({ message: 'Session not found' });

  if (!isActiveSession(session)) return res.status(400).json({ message: 'Session is not active' });

  const student = await dbAsync.get('SELECT * FROM STUDENT WHERE student_id = ?', [student_id]);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  if (student.student_class_id !== session.class_id) {
    return res.status(400).json({ message: 'Student does not belong to this class' });
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

export const studentAttendanceHistory = async (req, res) => {
  const { student_id } = req.params;

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

  return res.json(records);
};
