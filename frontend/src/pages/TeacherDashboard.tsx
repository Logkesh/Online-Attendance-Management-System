import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Course, SessionResponse } from '../types';
import { MobileShell } from '../components/MobileShell';

export const TeacherDashboard = () => {
  const { token, user, logout } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
  const [sessionTitle, setSessionTitle] = useState('Today Lecture');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [radius, setRadius] = useState('40');
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
      setMessage('Course created successfully.');
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
      setMessage('Session created. Share QR now.');
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <MobileShell title={`Hi ${user?.name ?? 'Teacher'}`} subtitle="Create classes and launch live QR attendance.">
      <div className="mb-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-700">
        Courses: <span className="font-bold">{courses.length}</span>
        <button className="float-right font-semibold text-rose-600" onClick={logout}>Logout</button>
      </div>

      <section className="mb-4 space-y-2 rounded-2xl border border-slate-200 p-3">
        <h2 className="text-sm font-semibold">Create Course</h2>
        <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Course name" value={name} onChange={(event) => setName(event.target.value)} />
        <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Course code" value={code} onChange={(event) => setCode(event.target.value)} />
        <button className="w-full rounded-xl bg-slate-900 py-2 text-sm font-semibold text-white" onClick={createCourse}>Save Course</button>
      </section>

      <section className="space-y-2 rounded-2xl border border-slate-200 p-3">
        <h2 className="text-sm font-semibold">Create Attendance Session</h2>
        <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={selectedCourseId} onChange={(event) => setSelectedCourseId(Number(event.target.value))}>
          <option value="">Select course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
          ))}
        </select>
        <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={sessionTitle} onChange={(event) => setSessionTitle(event.target.value)} placeholder="Session title" />
        <div className="grid grid-cols-2 gap-2">
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={lat} onChange={(event) => setLat(event.target.value)} placeholder="Latitude" />
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={lon} onChange={(event) => setLon(event.target.value)} placeholder="Longitude" />
        </div>
        <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={radius} onChange={(event) => setRadius(event.target.value)} placeholder="Radius (m)" />
        <button className="w-full rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white" onClick={createSession}>Generate QR Session</button>
      </section>

      {createdSession && (
        <section className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-center">
          <p className="text-xs font-semibold text-emerald-700">Active QR</p>
          <img src={createdSession.qrDataUrl} alt="QR code" className="mx-auto mt-2 w-44 rounded-xl bg-white p-2" />
          <p className="mt-2 text-xs text-slate-600">Valid till {new Date(createdSession.expiresAt).toLocaleString()}</p>
          <p className="mt-1 break-all text-[11px] text-slate-500">Token: {createdSession.qrToken}</p>
        </section>
      )}

      {message && <p className="mt-3 text-center text-xs text-slate-600">{message}</p>}
    </MobileShell>
  );
};
