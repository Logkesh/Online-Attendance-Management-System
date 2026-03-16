PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS FACULTY (
  faculty_id INTEGER PRIMARY KEY AUTOINCREMENT,
  faculty_name TEXT NOT NULL,
  faculty_username TEXT NOT NULL UNIQUE,
  faculty_password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS STUDENT (
  student_id INTEGER PRIMARY KEY AUTOINCREMENT,
  stud_name TEXT NOT NULL,
  stud_username TEXT NOT NULL UNIQUE,
  student_password TEXT NOT NULL,
  student_class_id INTEGER,
  FOREIGN KEY (student_class_id) REFERENCES CLASS (class_id)
);

CREATE TABLE IF NOT EXISTS CLASS (
  class_id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS SUBJECT (
  sub_id INTEGER PRIMARY KEY AUTOINCREMENT,
  sub_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS FACULTY_TO_CLASS (
  faculty_id INTEGER,
  class_id INTEGER,
  sub_id INTEGER,
  noofclasseshappnd INTEGER DEFAULT 0,
  PRIMARY KEY (faculty_id, class_id, sub_id),
  FOREIGN KEY (faculty_id) REFERENCES FACULTY (faculty_id),
  FOREIGN KEY (class_id) REFERENCES CLASS (class_id),
  FOREIGN KEY (sub_id) REFERENCES SUBJECT (sub_id)
);

CREATE TABLE IF NOT EXISTS CLASS_SESSION (
  session_id TEXT PRIMARY KEY,
  qrcode TEXT NOT NULL,
  subject_id INTEGER,
  class_id INTEGER,
  faculty_id INTEGER,
  starttime TEXT NOT NULL,
  endtime TEXT NOT NULL,
  date TEXT NOT NULL,
  FOREIGN KEY (subject_id) REFERENCES SUBJECT (sub_id),
  FOREIGN KEY (class_id) REFERENCES CLASS (class_id),
  FOREIGN KEY (faculty_id) REFERENCES FACULTY (faculty_id)
);

CREATE TABLE IF NOT EXISTS ATTENDANCE (
  session_id TEXT,
  student_id INTEGER,
  time TEXT NOT NULL,
  date TEXT NOT NULL,
  PRIMARY KEY (session_id, student_id),
  FOREIGN KEY (session_id) REFERENCES CLASS_SESSION (session_id),
  FOREIGN KEY (student_id) REFERENCES STUDENT (student_id)
);
