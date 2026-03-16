import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Course, SessionResponse } from '../types';
import { Card } from '../components/Card';

export const TeacherDashboard = () => {
  const { token, user, logout } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
  const [sessionTitle, setSessionTitle] = useState('Today Lecture');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [radius, setRadius] = useState('50');
  const [createdSession, setCreatedSession] = useState<SessionResponse | null>(null);
  const [message, setMessage] = useState('');

  const loadCourses = async () => {
    if (!token) return;
    const data = await apiFetch<{ courses: Course[] }>('/courses', {}, token);
    setCourses(data.courses);
  };

  useEffect(() => {
    void loadCourses();
  }, [token]);

  const createCourse = async () => {
    if (!token) return;
    try {
      await apiFetch('/courses', { method: 'POST', body: JSON.stringify({ name, code }) }, token);
      setName('');
      setCode('');
      setMessage('Course created');
      await loadCourses();
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const createSession = async () => {
    if (!token || selectedCourseId === '') return;
    try {
      const data = await apiFetch<{ session: SessionResponse }>(
        '/sessions',
        {
          method: 'POST',
          body: JSON.stringify({
            courseId: selectedCourseId,
            title: sessionTitle,
            latitude: Number(lat),
            longitude: Number(lon),
            radiusMeters: Number(radius)
          })
        },
        token
      );
      setCreatedSession(data.session);
      setMessage('Session and QR created');
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md space-y-4 p-4">
      <header className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Welcome, {user?.name}</h1>
            <p className="text-sm text-slate-500">Teacher Dashboard</p>
          </div>
          <button className="text-sm text-red-600" onClick={logout}>Logout</button>
        </div>
      </header>

      <Card title="Create Course">
        <input className="mb-2 w-full rounded-xl border p-2" placeholder="Course Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="mb-2 w-full rounded-xl border p-2" placeholder="Course Code" value={code} onChange={(e) => setCode(e.target.value)} />
        <button className="w-full rounded-xl bg-blue-600 py-2 text-white" onClick={createCourse}>Create</button>
      </Card>

      <Card title="Start Attendance Session">
        <select className="mb-2 w-full rounded-xl border p-2" value={selectedCourseId} onChange={(e) => setSelectedCourseId(Number(e.target.value))}>
          <option value="">Select Course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
          ))}
        </select>
        <input className="mb-2 w-full rounded-xl border p-2" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} placeholder="Session title" />
        <input className="mb-2 w-full rounded-xl border p-2" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude" />
        <input className="mb-2 w-full rounded-xl border p-2" value={lon} onChange={(e) => setLon(e.target.value)} placeholder="Longitude" />
        <input className="mb-2 w-full rounded-xl border p-2" value={radius} onChange={(e) => setRadius(e.target.value)} placeholder="Radius in meters" />
        <button className="w-full rounded-xl bg-emerald-600 py-2 text-white" onClick={createSession}>Create QR Session</button>
      </Card>

      {createdSession && (
        <Card title="Live QR Code">
          <img src={createdSession.qrDataUrl} alt="Attendance QR" className="mx-auto w-52" />
          <p className="mt-2 text-center text-sm text-slate-600">Valid until {new Date(createdSession.expiresAt).toLocaleString()}</p>
        </Card>
      )}

      {message && <p className="text-center text-sm text-slate-700">{message}</p>}
    </main>
  );
};
