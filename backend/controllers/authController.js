import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { dbAsync } from '../config/db.js';

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || 'attendance_secret', { expiresIn: '8h' });

export const facultyLogin = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'username and password are required' });

  const faculty = await dbAsync.get('SELECT * FROM FACULTY WHERE faculty_username = ?', [username]);
  if (!faculty) return res.status(401).json({ message: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, faculty.faculty_password);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  const token = signToken({ role: 'faculty', id: faculty.faculty_id, username: faculty.faculty_username });
  return res.json({ token, user: { id: faculty.faculty_id, name: faculty.faculty_name, role: 'faculty' } });
};

export const studentLogin = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'username and password are required' });

  const student = await dbAsync.get('SELECT * FROM STUDENT WHERE stud_username = ?', [username]);
  if (!student) return res.status(401).json({ message: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, student.student_password);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  const token = signToken({ role: 'student', id: student.student_id, username: student.stud_username });
  return res.json({ token, user: { id: student.student_id, name: student.stud_name, role: 'student' } });
};
