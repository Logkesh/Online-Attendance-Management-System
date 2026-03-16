# QR Code and Location-Based Attendance Management System

A complete 3-tier full-stack project:

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + JWT + bcrypt + CORS
- **Database:** SQLite

## Project Structure

```text
root/
├── frontend/
├── backend/
└── database/
```

## Database Schema

Database file: `database/attendance_system.db`

Tables implemented:
- `FACULTY`
- `STUDENT`
- `CLASS`
- `SUBJECT`
- `FACULTY_TO_CLASS`
- `CLASS_SESSION`
- `ATTENDANCE`

Schema script: `database/init.sql`

## Backend Structure

```text
backend/
├── server.js
├── config/db.js
├── routes/
│   ├── authRoutes.js
│   ├── sessionRoutes.js
│   └── attendanceRoutes.js
├── controllers/
│   ├── authController.js
│   ├── sessionController.js
│   └── attendanceController.js
└── middleware/
    └── authMiddleware.js
```

## Frontend Screens

- SplashScreen
- LoginScreen
- FacultyHomeScreen
- StudentHomeScreen
- FacultyDashboardScreen
- StudentDashboardScreen
- StartAttendanceScreen
- QRDisplayScreen
- QRScanScreen
- ManualAttendanceScreen
- AttendanceStatusScreen

Implemented in `frontend/src/App.tsx` with React Router routes.

## API Endpoints

### Auth
- `POST /api/auth/faculty/login`
- `POST /api/auth/student/login`

### Session
- `POST /api/session/create`
- `POST /api/session/validate`
- `GET /api/session/faculty/:faculty_id`

### Attendance
- `POST /api/attendance/mark`
- `GET /api/attendance/student/:student_id`

## Sample Test Data

Seeded automatically at backend start:

- Faculty:
  - username: `faculty1`
  - password: `faculty123`
- Student:
  - username: `student1`
  - password: `student123`
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

Backend: `http://localhost:4000`

### 3) Start frontend

```bash
cd frontend
npm run dev
```

Frontend: `http://localhost:5173`

## Notes

- JWT middleware protects session and attendance routes.
- Passwords are hashed using bcrypt.
- Attendance duplicate prevention is enforced by both API checks and DB composite primary key.
