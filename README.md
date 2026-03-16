# QR Code + Location-Based Attendance Management System

Full-stack attendance platform inspired by the provided QR attendance GitHub project and implemented with a mobile-first UI approach aligned to the provided Figma wireframe.

## Tech Stack

### Frontend
- React.js
- Vite
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- Express.js
- JWT authentication
- bcrypt password hashing
- QR code generation (`qrcode`)

### Database
- SQLite

## Features

- User registration/login (`teacher` and `student` roles)
- JWT-protected APIs
- Teacher:
  - Create courses
  - Start attendance sessions with:
    - QR token
    - Class location (lat/lon)
    - Allowed attendance radius
    - Expiration timestamp
  - View generated QR image for live attendance
- Student:
  - Enroll in course by `courseId`
  - Submit attendance with:
    - scanned QR token
    - current latitude/longitude
- Attendance validation rules:
  - Valid QR session token
  - Session not expired
  - Student enrolled in course
  - Student within allowed geofence radius
  - One attendance record per student per session

## Project Structure

```text
.
├── backend
│   ├── src
│   │   ├── auth.js
│   │   ├── db.js
│   │   ├── server.js
│   │   └── utils.js
│   └── package.json
└── frontend
    ├── src
    │   ├── api
    │   ├── components
    │   ├── context
    │   ├── pages
    │   └── types
    └── package.json
```

## Setup

### 1) Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2) Configure backend env

```bash
cd backend
cp .env.example .env
# edit JWT_SECRET if needed
```

### 3) Run backend

```bash
cd backend
npm run dev
```

Backend runs at `http://localhost:4000`.

### 4) Run frontend

```bash
cd frontend
npm run dev
```

Frontend runs at `http://localhost:5173` and calls backend at `http://localhost:4000/api`.

To override API URL in frontend, set `VITE_API_URL`.

## Key API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/courses`
- `POST /api/courses`
- `POST /api/courses/:courseId/enroll`
- `POST /api/sessions`
- `POST /api/attendance/scan`
- `GET /api/sessions/:sessionId/attendance`

## Notes

- For QR scanning in production mobile apps, integrate a scanner library and pass the extracted `qrToken` into the attendance API.
- This implementation currently provides a token input field in the student dashboard for quick testing.
