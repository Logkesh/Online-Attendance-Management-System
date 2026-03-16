import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { apiRequest } from './services/api';
import { FormEvent, useState } from 'react';

const Screen = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="min-h-screen bg-slate-100 p-6">
    <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-bold">{title}</h1>
      {children}
    </div>
  </div>
);

const SplashScreen = () => <Navigate to="/login" replace />;

const LoginScreen = () => {
  const [role, setRole] = useState<'faculty' | 'student'>('faculty');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const data = await apiRequest(`/auth/${role}/login`, {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      login(data.token, data.user.id, role, data.user.name);
      navigate(role === 'faculty' ? '/faculty/home' : '/student/home');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Screen title="LoginScreen">
      <form onSubmit={submit} className="space-y-3">
        <select className="w-full rounded border p-2" value={role} onChange={(e) => setRole(e.target.value as 'faculty' | 'student')}>
          <option value="faculty">Faculty</option>
          <option value="student">Student</option>
        </select>
        <input className="w-full rounded border p-2" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="w-full rounded border p-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-red-600">{error}</p>}
        <button className="rounded bg-blue-600 px-4 py-2 text-white" type="submit">Sign In</button>
      </form>
      <p className="mt-4 text-sm text-slate-600">Sample faculty: faculty1/faculty123, student: student1/student123</p>
    </Screen>
  );
};

const FacultyHomeScreen = () => <HomeScreen role="faculty" />;
const StudentHomeScreen = () => <HomeScreen role="student" />;

const HomeScreen = ({ role }: { role: 'faculty' | 'student' }) => {
  const navigate = useNavigate();
  return (
    <Screen title={role === 'faculty' ? 'FacultyHomeScreen' : 'StudentHomeScreen'}>
      <button className="rounded bg-indigo-600 px-4 py-2 text-white" onClick={() => navigate(`/${role}/dashboard`)}>
        Open Dashboard
      </button>
    </Screen>
  );
};

const FacultyDashboardScreen = () => {
  const { token, userId } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const load = async () => setSessions(await apiRequest(`/session/faculty/${userId}`, {}, token));
  return (
    <Screen title="FacultyDashboardScreen">
      <div className="flex gap-2">
        <NavBtn to="/faculty/start" text="StartAttendanceScreen" />
        <NavBtn to="/faculty/manual" text="ManualAttendanceScreen" />
        <button className="rounded bg-slate-700 px-3 py-2 text-white" onClick={load}>Refresh Sessions</button>
      </div>
      <pre className="mt-4 overflow-auto rounded bg-slate-900 p-3 text-xs text-white">{JSON.stringify(sessions, null, 2)}</pre>
    </Screen>
  );
};

const StudentDashboardScreen = () => {
  const { token, userId } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const load = async () => setHistory(await apiRequest(`/attendance/student/${userId}`, {}, token));
  return (
    <Screen title="StudentDashboardScreen">
      <div className="flex gap-2">
        <NavBtn to="/student/scan" text="QRScanScreen" />
        <button className="rounded bg-slate-700 px-3 py-2 text-white" onClick={load}>Load History</button>
      </div>
      <pre className="mt-4 overflow-auto rounded bg-slate-900 p-3 text-xs text-white">{JSON.stringify(history, null, 2)}</pre>
    </Screen>
  );
};

const StartAttendanceScreen = () => {
  const { token, userId } = useAuth();
  const [payload, setPayload] = useState({ subject_id: 1, class_id: 1, starttime: '09:00:00', endtime: '18:00:00', date: new Date().toISOString().slice(0, 10) });
  const [session, setSession] = useState<any>(null);
  const create = async () => setSession(await apiRequest('/session/create', { method: 'POST', body: JSON.stringify({ ...payload, faculty_id: userId }) }, token));
  return (
    <Screen title="StartAttendanceScreen">
      <button className="rounded bg-emerald-600 px-4 py-2 text-white" onClick={create}>Create Session</button>
      {session && <pre className="mt-4 rounded bg-slate-900 p-3 text-xs text-white">{JSON.stringify(session, null, 2)}</pre>}
      <NavBtn to="/faculty/qr" text="QRDisplayScreen" />
    </Screen>
  );
};

const QRDisplayScreen = () => <Screen title="QRDisplayScreen"><p>Use the session qrcode payload from StartAttendanceScreen to render a QR in production.</p></Screen>;

const QRScanScreen = () => {
  const { token, userId } = useAuth();
  const [sessionId, setSessionId] = useState('');
  const [status, setStatus] = useState('');
  const mark = async () => {
    try {
      const data = await apiRequest('/attendance/mark', { method: 'POST', body: JSON.stringify({ session_id: sessionId, student_id: userId }) }, token);
      setStatus(data.message);
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  return (
    <Screen title="QRScanScreen">
      <input className="w-full rounded border p-2" placeholder="Paste scanned session_id" value={sessionId} onChange={(e) => setSessionId(e.target.value)} />
      <button className="mt-3 rounded bg-emerald-600 px-4 py-2 text-white" onClick={mark}>Mark Attendance</button>
      <p className="mt-3">{status}</p>
      <NavBtn to="/student/status" text="AttendanceStatusScreen" />
    </Screen>
  );
};

const ManualAttendanceScreen = () => <Screen title="ManualAttendanceScreen"><p>Manual attendance can be done by posting session_id and student_id to /api/attendance/mark.</p></Screen>;
const AttendanceStatusScreen = () => <Screen title="AttendanceStatusScreen"><p>Attendance result is shown after scan submission.</p></Screen>;

const NavBtn = ({ to, text }: { to: string; text: string }) => {
  const navigate = useNavigate();
  return <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={() => navigate(to)}>{text}</button>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<SplashScreen />} />
    <Route path="/login" element={<LoginScreen />} />
    <Route path="/faculty/home" element={<FacultyHomeScreen />} />
    <Route path="/student/home" element={<StudentHomeScreen />} />
    <Route path="/faculty/dashboard" element={<FacultyDashboardScreen />} />
    <Route path="/student/dashboard" element={<StudentDashboardScreen />} />
    <Route path="/faculty/start" element={<StartAttendanceScreen />} />
    <Route path="/faculty/qr" element={<QRDisplayScreen />} />
    <Route path="/student/scan" element={<QRScanScreen />} />
    <Route path="/faculty/manual" element={<ManualAttendanceScreen />} />
    <Route path="/student/status" element={<AttendanceStatusScreen />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
