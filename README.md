# QR Code and Location-Based Smart Attendance Management System

## Stack
- Frontend: React + Vite + TypeScript + Tailwind
- Backend: Node.js + Express + JWT + bcrypt + qrcode
- Database: SQLite (`database/attendance_system.db`)

## Key implemented behavior
- Faculty starts attendance session from mobile UI.
- Faculty location is captured automatically from device geolocation.
- Backend generates QR payload + QR image and stores session with location + allowed radius.
- QR display screen shows generated QR image with a fixed 5:00 to 0:00 validity countdown.
- Manual attendance entry is available inside QR generation flow (from QR display screen) and marks selected students present for that live session.
- Student scans with device camera (no session textbox).
- Student location is captured automatically when scanning and validated against session range.
- Duplicate attendance is blocked.

## Backend routes
- `POST /api/auth/faculty/login`
- `POST /api/auth/student/login`
- `POST /api/session/create`
- `POST /api/session/validate`
- `GET /api/session/faculty/:faculty_id`
- `POST /api/attendance/mark`
- `GET /api/attendance/class/:class_id/students`
- `GET /api/attendance/student/:student_id`

## DB initialization / seeding
DB is auto-initialized and seeded **before server starts listening** via `initializeDatabase()` in `backend/server.js`.

Seeded users:
- Faculty: `faculty1 / faculty123`
- Student: `student1 / student123`

## Run
```bash
cd backend && npm install && node server.js
cd frontend && npm install && npm run dev
```


## Wi-Fi / Mobile device access (Vite `--host`)

If you open the frontend from another device on the same Wi-Fi network:

1. Start backend bound to all interfaces (default now):
```bash
cd backend
node server.js
```
Backend logs both localhost and LAN URL (`http://<your-lan-ip>:4000`).

2. Start frontend with host mode:
```bash
cd frontend
npm run dev -- --host
```

3. Open `http://<your-lan-ip>:5173` on the mobile device.

The frontend now auto-targets `http://<current-hostname>:4000/api` on non-localhost hosts.
You can still override manually with `VITE_API_URL`.
