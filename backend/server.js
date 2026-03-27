import express from 'express';
import cors from 'cors';
import os from 'os';
import authRoutes from './routes/authRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import { initializeDatabase } from './config/db.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '0.0.0.0';

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS origin blocked'));
    }
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const getLanAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const infoList of Object.values(interfaces)) {
    if (!infoList) continue;
    for (const info of infoList) {
      if (info.family === 'IPv4' && !info.internal) return info.address;
    }
  }
  return null;
};

initializeDatabase().then(() => {
  app.listen(PORT, HOST, () => {
    const lan = getLanAddress();
    console.log(`Backend server running at http://localhost:${PORT}`);
    if (lan) {
      console.log(`LAN access: http://${lan}:${PORT}`);
    }
  });
});
