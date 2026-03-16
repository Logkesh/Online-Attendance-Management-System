import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Course } from '../types';
import { Card } from '../components/Card';

export const StudentDashboard = () => {
  const { token, user, logout } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollCourseId, setEnrollCourseId] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [message, setMessage] = useState('');

  const loadCourses = async () => {
    if (!token) return;
    const data = await apiFetch<{ courses: Course[] }>('/courses', {}, token);
    setCourses(data.courses);
  };

  useEffect(() => {
    void loadCourses();
  }, [token]);

  const enroll = async () => {
    if (!token || !enrollCourseId) return;
    try {
      const data = await apiFetch<{ message: string }>(`/courses/${enrollCourseId}/enroll`, { method: 'POST' }, token);
      setMessage(data.message);
      await loadCourses();
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const markAttendance = async () => {
    if (!token) return;
    try {
      const data = await apiFetch<{ message: string; distanceMeters?: number }>(
        '/attendance/scan',
        {
          method: 'POST',
          body: JSON.stringify({ qrToken, latitude: Number(lat), longitude: Number(lon) })
        },
        token
      );
      setMessage(data.distanceMeters ? `${data.message} (${data.distanceMeters} m)` : data.message);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md space-y-4 p-4">
      <header className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Hello, {user?.name}</h1>
            <p className="text-sm text-slate-500">Student Dashboard</p>
          </div>
          <button className="text-sm text-red-600" onClick={logout}>Logout</button>
        </div>
      </header>

      <Card title="Enroll by Course ID">
        <input className="mb-2 w-full rounded-xl border p-2" value={enrollCourseId} onChange={(e) => setEnrollCourseId(e.target.value)} placeholder="Course ID" />
        <button className="w-full rounded-xl bg-blue-600 py-2 text-white" onClick={enroll}>Enroll</button>
      </Card>

      <Card title="Mark Attendance">
        <input className="mb-2 w-full rounded-xl border p-2" value={qrToken} onChange={(e) => setQrToken(e.target.value)} placeholder="QR Token" />
        <input className="mb-2 w-full rounded-xl border p-2" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Your latitude" />
        <input className="mb-2 w-full rounded-xl border p-2" value={lon} onChange={(e) => setLon(e.target.value)} placeholder="Your longitude" />
        <button className="w-full rounded-xl bg-emerald-600 py-2 text-white" onClick={markAttendance}>Submit Attendance</button>
      </Card>

      <Card title="My Courses">
        <ul className="space-y-2 text-sm">
          {courses.map((c) => (
            <li key={c.id} className="rounded-lg bg-slate-100 p-2">
              {c.name} - {c.code} (ID: {c.id})
            </li>
          ))}
          {courses.length === 0 && <li className="text-slate-500">No enrolled courses.</li>}
        </ul>
      </Card>

      {message && <p className="text-center text-sm text-slate-700">{message}</p>}
    </main>
  );
};
