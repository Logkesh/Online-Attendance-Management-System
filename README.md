# QR Code and Location-Based Smart Attendance Management System

A complete 3-tier attendance system for a college project:

- **Frontend:** React + Vite + TypeScript + Tailwind CSS (Android-style low-fidelity wireframe UI)
- **Backend:** Node.js + Express + JWT + bcrypt + CORS
- **Database:** SQLite

## Project Structure

```text
root/
├── frontend/
├── backend/
└── database/
```

## Database

- SQLite DB file: `database/attendance_system.db`
- SQL schema script: `database/init.sql`
- Required tables implemented:
  - `FACULTY`
  - `STUDENT`
  - `CLASS`
  - `SUBJECT`
  - `FACULTY_TO_CLASS`
  - `CLASS_SESSION`
  - `ATTENDANCE`

## Backend API

### Auth
- `POST /api/auth/faculty/login`
- `POST /api/auth/student/login`

### Session
- `POST /api/session/create`
- `POST /api/session/validate`
- `GET /api/session/faculty/:faculty_id`

### Attendance
- `POST /api/attendance/mark`
- `GET /api/attendance/class/:class_id/students`
- `GET /api/attendance/student/:student_id`

## Frontend Screens (implemented)

### Common
- Splash Screen
- Login Screen

### Faculty
- Faculty Home Screen
- Start Attendance Screen
- QR Code Display Screen (live generated QR-style matrix + countdown)
- Manual Attendance Screen (student list + checkbox selection + save)
- Faculty Dashboard (total classes, present count, subject-wise summary)

### Student
- Student Home Screen
- QR Scan Screen (camera frame layout + session validation + attendance mark)
- Attendance Status Screen (success/failure)
- Student Dashboard (overall %, subject-wise cards, attendance history)

## Sample Seeded Data

Inserted automatically on first backend run:

- Faculty: `faculty1 / faculty123`
- Student: `student1 / student123`
- Class: `CSE-A`
- Subject: `Data Structures`

## Run Locally

### 1) Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2) Start backend

```bash
cd backend
node server.js
```

### 3) Start frontend

```bash
cd frontend
npm run dev
```

## Security and Validation

- JWT authentication middleware for protected routes
- Password hashing using bcrypt
- Session activity/time validation
- Duplicate attendance prevention at API + composite PK level
