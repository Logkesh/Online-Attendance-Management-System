import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../database/attendance_system.db');

const db = new sqlite3.Database(dbPath);

const run = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.run(query, params, function onRun(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const get = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const all = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const ensureColumn = async (tableName, columnName, definition) => {
  const columns = await all(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((col) => col.name === columnName);
  if (!exists) {
    await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
};

export const initializeDatabase = async () => {
  await run('PRAGMA foreign_keys = ON');

  await run(`CREATE TABLE IF NOT EXISTS FACULTY (
    faculty_id INTEGER PRIMARY KEY AUTOINCREMENT,
    faculty_name TEXT NOT NULL,
    faculty_username TEXT NOT NULL UNIQUE,
    faculty_password TEXT NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS CLASS (
    class_id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_name TEXT NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS SUBJECT (
    sub_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sub_name TEXT NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS STUDENT (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    stud_name TEXT NOT NULL,
    stud_username TEXT NOT NULL UNIQUE,
    student_password TEXT NOT NULL,
    student_class_id INTEGER,
    FOREIGN KEY (student_class_id) REFERENCES CLASS (class_id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS FACULTY_TO_CLASS (
    faculty_id INTEGER,
    class_id INTEGER,
    sub_id INTEGER,
    noofclasseshappnd INTEGER DEFAULT 0,
    PRIMARY KEY (faculty_id, class_id, sub_id),
    FOREIGN KEY (faculty_id) REFERENCES FACULTY (faculty_id),
    FOREIGN KEY (class_id) REFERENCES CLASS (class_id),
    FOREIGN KEY (sub_id) REFERENCES SUBJECT (sub_id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS CLASS_SESSION (
    session_id TEXT PRIMARY KEY,
    qrcode TEXT NOT NULL,
    qr_image TEXT,
    subject_id INTEGER,
    class_id INTEGER,
    faculty_id INTEGER,
    starttime TEXT NOT NULL,
    endtime TEXT NOT NULL,
    date TEXT NOT NULL,
    faculty_lat REAL,
    faculty_lng REAL,
    allowed_radius_m INTEGER DEFAULT 100,
    FOREIGN KEY (subject_id) REFERENCES SUBJECT (sub_id),
    FOREIGN KEY (class_id) REFERENCES CLASS (class_id),
    FOREIGN KEY (faculty_id) REFERENCES FACULTY (faculty_id)
  )`);

  await ensureColumn('CLASS_SESSION', 'qr_image', 'TEXT');
  await ensureColumn('CLASS_SESSION', 'faculty_lat', 'REAL');
  await ensureColumn('CLASS_SESSION', 'faculty_lng', 'REAL');
  await ensureColumn('CLASS_SESSION', 'allowed_radius_m', 'INTEGER DEFAULT 100');

  await run(`CREATE TABLE IF NOT EXISTS ATTENDANCE (
    session_id TEXT,
    student_id INTEGER,
    time TEXT NOT NULL,
    date TEXT NOT NULL,
    PRIMARY KEY (session_id, student_id),
    FOREIGN KEY (session_id) REFERENCES CLASS_SESSION (session_id),
    FOREIGN KEY (student_id) REFERENCES STUDENT (student_id)
  )`);

  await seedData();
};

const seedData = async () => {
  const faculty = await get('SELECT faculty_id FROM FACULTY WHERE faculty_username = ?', ['faculty1']);
  if (faculty) return;

  const facultyPassword = await bcrypt.hash('faculty123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  await run('INSERT INTO FACULTY (faculty_name, faculty_username, faculty_password) VALUES (?, ?, ?)', [
    'Dr. Alice',
    'faculty1',
    facultyPassword
  ]);

  await run('INSERT INTO CLASS (class_name) VALUES (?)', ['CSE-A']);
  await run('INSERT INTO SUBJECT (sub_name) VALUES (?)', ['Data Structures']);

  await run('INSERT INTO STUDENT (stud_name, stud_username, student_password, student_class_id) VALUES (?, ?, ?, ?)', [
    'Bob Student',
    'student1',
    studentPassword,
    1
  ]);

  await run('INSERT INTO FACULTY_TO_CLASS (faculty_id, class_id, sub_id, noofclasseshappnd) VALUES (?, ?, ?, ?)', [
    1,
    1,
    1,
    0
  ]);
};

export const dbAsync = { run, get, all };

export default db;
