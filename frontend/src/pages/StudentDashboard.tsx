import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Course } from '../types';
import { MobileShell } from '../components/MobileShell';

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
      setMessage(data.distanceMeters ? `${data.message} (${data.distanceMeters}m)` : data.message);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <MobileShell title={`Hello ${user?.name ?? 'Student'}`} subtitle="Enroll and mark attendance with QR + location.">
      <div className="mb-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-700">
        Enrolled Courses: <span className="font-bold">{courses.length}</span>
        <button className="float-right font-semibold text-rose-600" onClick={logout}>Logout</button>
      </div>

      <section className="mb-4 space-y-2 rounded-2xl border border-slate-200 p-3">
        <h2 className="text-sm font-semibold">Join a Course</h2>
        <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Course ID" value={enrollCourseId} onChange={(event) => setEnrollCourseId(event.target.value)} />
        <button className="w-full rounded-xl bg-slate-900 py-2 text-sm font-semibold text-white" onClick={enroll}>Enroll</button>
      </section>

      <section className="space-y-2 rounded-2xl border border-slate-200 p-3">
        <h2 className="text-sm font-semibold">Mark Attendance</h2>
        <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="QR token from scanner" value={qrToken} onChange={(event) => setQrToken(event.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Latitude" value={lat} onChange={(event) => setLat(event.target.value)} />
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Longitude" value={lon} onChange={(event) => setLon(event.target.value)} />
        </div>
        <button className="w-full rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white" onClick={markAttendance}>Submit Attendance</button>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 p-3">
        <h2 className="mb-2 text-sm font-semibold">My Courses</h2>
        <ul className="space-y-2 text-xs">
          {courses.length === 0 && <li className="text-slate-400">No courses yet.</li>}
          {courses.map((course) => (
            <li key={course.id} className="rounded-xl bg-slate-100 px-3 py-2">
              {course.name} · {course.code} · ID {course.id}
            </li>
          ))}
        </ul>
      </section>

      {message && <p className="mt-3 text-center text-xs text-slate-600">{message}</p>}
    </MobileShell>
  );
};
