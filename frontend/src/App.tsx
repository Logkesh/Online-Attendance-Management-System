import { FormEvent, ReactElement, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { apiRequest } from './services/api';

type Role = 'faculty' | 'student';

type SessionResponse = {
  session_id: string;
  qrcode: string;
  class_id: number;
  subject_id: number;
  faculty_id: number;
  starttime: string;
  endtime: string;
  date: string;
};

type Student = { student_id: number; stud_name: string; stud_username: string };

const MobileScreen = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-200 px-4 py-5">
      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-lg">
        <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h1 className="text-sm font-semibold text-slate-800">{title}</h1>
          <span className="text-[10px] text-slate-500">{location.pathname}</span>
        </header>
        <main className="space-y-4 p-4">{children}</main>
      </div>
    </div>
  );
};

const ActionButton = ({ text, onClick, variant = 'default' }: { text: string; onClick: () => void; variant?: 'default' | 'danger' | 'muted' }) => {
  const style =
    variant === 'danger'
      ? 'bg-rose-600 text-white'
      : variant === 'muted'
      ? 'bg-slate-200 text-slate-800'
      : 'bg-slate-800 text-white';

  return (
    <button className={`w-full rounded-lg px-4 py-2 text-sm font-medium ${style}`} onClick={onClick}>
      {text}
    </button>
  );
};

const ScreenCard = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3">{children}</div>
);

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/login', { replace: true }), 1000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <MobileScreen title="Splash Screen">
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
        <div className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-slate-700 text-2xl">QR</div>
        <p className="text-center text-sm font-semibold text-slate-800">QR Code and Location-Based Smart Attendance</p>
        <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-2/3 animate-pulse bg-slate-600" />
        </div>
      </div>
    </MobileScreen>
  );
};

const LoginScreen = () => {
  const [role, setRole] = useState<Role>('faculty');
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
      navigate(role === 'faculty' ? '/faculty/home' : '/student/home', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <MobileScreen title="Login Screen">
      <form onSubmit={submit} className="space-y-3">
        <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="faculty">Faculty</option>
          <option value="student">Student</option>
        </select>
        <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Email / ID" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <button className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white" type="submit">
          Login
        </button>
      </form>
      <p className="text-[11px] text-slate-500">Demo: faculty1/faculty123 and student1/student123</p>
    </MobileScreen>
  );
};

const FacultyHomeScreen = () => {
  const navigate = useNavigate();
  const { logout, name } = useAuth();

  return (
    <MobileScreen title="Faculty Home Screen">
      <p className="text-sm text-slate-700">Welcome, {name}</p>
      <ActionButton text="Start Attendance Session" onClick={() => navigate('/faculty/start')} />
      <ActionButton text="Manual Attendance" onClick={() => navigate('/faculty/manual')} />
      <ActionButton text="View Attendance Dashboard" onClick={() => navigate('/faculty/dashboard')} />
      <ActionButton text="Logout" variant="danger" onClick={() => { logout(); navigate('/login'); }} />
    </MobileScreen>
  );
};

const StudentHomeScreen = () => {
  const navigate = useNavigate();
  const { logout, name } = useAuth();

  return (
    <MobileScreen title="Student Home Screen">
      <p className="text-sm text-slate-700">Welcome, {name}</p>
      <ActionButton text="Scan QR Code" onClick={() => navigate('/student/scan')} />
      <ActionButton text="View Attendance Dashboard" onClick={() => navigate('/student/dashboard')} />
      <ActionButton text="Logout" variant="danger" onClick={() => { logout(); navigate('/login'); }} />
    </MobileScreen>
  );
};

const StartAttendanceScreen = () => {
  const { token, userId } = useAuth();
  const navigate = useNavigate();
  const [classId, setClassId] = useState(1);
  const [subjectId, setSubjectId] = useState(1);
  const [starttime, setStarttime] = useState('09:00:00');
  const [endtime, setEndtime] = useState('09:10:00');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState('');

  const startSession = async () => {
    try {
      const data = (await apiRequest(
        '/session/create',
        {
          method: 'POST',
          body: JSON.stringify({ subject_id: subjectId, class_id: classId, faculty_id: userId, starttime, endtime, date })
        },
        token
      )) as SessionResponse;

      localStorage.setItem('active-session', JSON.stringify(data));
      setMessage(`Session started (${data.session_id.slice(0, 8)}...)`);
      navigate('/faculty/qr');
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  return (
    <MobileScreen title="Start Attendance Screen">
      <ScreenCard>
        <label className="mb-1 block text-xs text-slate-500">Select Class</label>
        <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={classId} onChange={(e) => setClassId(Number(e.target.value))}>
          <option value={1}>CSE-A</option>
        </select>
      </ScreenCard>
      <ScreenCard>
        <label className="mb-1 block text-xs text-slate-500">Select Subject</label>
        <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={subjectId} onChange={(e) => setSubjectId(Number(e.target.value))}>
          <option value={1}>Data Structures</option>
        </select>
      </ScreenCard>
      <div className="grid grid-cols-2 gap-2">
        <input className="rounded-lg border border-slate-300 px-2 py-2 text-xs" type="time" value={starttime.slice(0, 5)} onChange={(e) => setStarttime(`${e.target.value}:00`)} />
        <input className="rounded-lg border border-slate-300 px-2 py-2 text-xs" type="time" value={endtime.slice(0, 5)} onChange={(e) => setEndtime(`${e.target.value}:00`)} />
      </div>
      <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <ActionButton text="Start Session" onClick={startSession} />
      {message && <p className="text-xs text-slate-600">{message}</p>}
    </MobileScreen>
  );
};

const qrs = (value: string) => {
  const size = 17;
  const chars = value.split('').map((ch) => ch.charCodeAt(0));
  return Array.from({ length: size * size }, (_, i) => {
    const code = chars[i % Math.max(chars.length, 1)] || 0;
    return (code + i * 13) % 2 === 0;
  });
};

const QRCodeDisplayScreen = () => {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem('active-session');
    if (raw) setSession(JSON.parse(raw));
  }, []);

  const secondsLeft = useMemo(() => {
    if (!session) return 0;
    const end = new Date(`${session.date}T${session.endtime}`).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((end - now) / 1000));
  }, [session]);

  const [liveSeconds, setLiveSeconds] = useState(secondsLeft);
  useEffect(() => {
    setLiveSeconds(secondsLeft);
  }, [secondsLeft]);
  useEffect(() => {
    const id = setInterval(() => setLiveSeconds((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  if (!session) {
    return (
      <MobileScreen title="QR Code Display Screen">
        <p className="text-sm text-slate-600">No active session found.</p>
        <ActionButton text="Back to Start Session" onClick={() => navigate('/faculty/start')} />
      </MobileScreen>
    );
  }

  const bits = qrs(session.session_id);
  const mins = `${Math.floor(liveSeconds / 60)}`.padStart(2, '0');
  const secs = `${liveSeconds % 60}`.padStart(2, '0');

  return (
    <MobileScreen title="QR Code Display Screen">
      <ScreenCard>
        <div className="mx-auto grid w-60 grid-cols-[repeat(17,minmax(0,1fr))] gap-[2px] rounded-lg border border-slate-300 p-2">
          {bits.map((filled, idx) => (
            <span key={idx} className={`aspect-square rounded-[2px] ${filled ? 'bg-slate-800' : 'bg-slate-100'}`} />
          ))}
        </div>
      </ScreenCard>
      <p className="text-center text-sm font-medium text-slate-800">Time Left: {mins}:{secs}</p>
      <p className="break-all rounded-lg bg-slate-100 p-2 text-[10px] text-slate-600">Session ID: {session.session_id}</p>
      <ActionButton
        text="End Session"
        variant="danger"
        onClick={() => {
          localStorage.removeItem('active-session');
          navigate('/faculty/home');
        }}
      />
    </MobileScreen>
  );
};

const ManualAttendanceScreen = () => {
  const { token } = useAuth();
  const [sessionId, setSessionId] = useState('');
  const [classId, setClassId] = useState(1);
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [status, setStatus] = useState('');

  const loadStudents = async () => {
    try {
      const list = await apiRequest(`/attendance/class/${classId}/students`, {}, token);
      setStudents(list);
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const saveManualAttendance = async () => {
    if (!sessionId) {
      setStatus('Please enter a session ID.');
      return;
    }

    const selectedStudents = students.filter((s) => selected[s.student_id]);
    if (selectedStudents.length === 0) {
      setStatus('Select at least one student.');
      return;
    }

    const results = await Promise.allSettled(
      selectedStudents.map((s) =>
        apiRequest('/attendance/mark', { method: 'POST', body: JSON.stringify({ session_id: sessionId, student_id: s.student_id }) }, token)
      )
    );

    const success = results.filter((r) => r.status === 'fulfilled').length;
    setStatus(`Saved ${success}/${selectedStudents.length} attendance entries.`);
  };

  return (
    <MobileScreen title="Manual Attendance Screen">
      <div className="grid grid-cols-2 gap-2">
        <input className="rounded-lg border border-slate-300 px-2 py-2 text-xs" value={sessionId} placeholder="Session ID" onChange={(e) => setSessionId(e.target.value)} />
        <select className="rounded-lg border border-slate-300 px-2 py-2 text-xs" value={classId} onChange={(e) => setClassId(Number(e.target.value))}>
          <option value={1}>CSE-A</option>
        </select>
      </div>
      <ActionButton text="Load Students" variant="muted" onClick={loadStudents} />
      <div className="max-h-72 space-y-2 overflow-auto rounded-lg border border-slate-200 p-2">
        {students.map((student) => (
          <label key={student.student_id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <span>{student.stud_name}</span>
            <input
              type="checkbox"
              checked={Boolean(selected[student.student_id])}
              onChange={(e) =>
                setSelected((prev) => ({
                  ...prev,
                  [student.student_id]: e.target.checked
                }))
              }
            />
          </label>
        ))}
      </div>
      <ActionButton text="Save" onClick={saveManualAttendance} />
      {status && <p className="text-xs text-slate-600">{status}</p>}
    </MobileScreen>
  );
};

const FacultyDashboardScreen = () => {
  const { token, userId } = useAuth();
  const [cards, setCards] = useState({ totalClasses: 0, presentCount: 0 });
  const [subjectSummary, setSubjectSummary] = useState<Record<string, { sessions: number; present: number }>>({});

  const load = async () => {
    const data = await apiRequest(`/session/faculty/${userId}`, {}, token);
    setCards(data.cards);
    setSubjectSummary(data.subjectSummary);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <MobileScreen title="Faculty Dashboard">
      <div className="grid grid-cols-2 gap-2">
        <ScreenCard>
          <p className="text-xs text-slate-500">Total Classes</p>
          <p className="text-xl font-bold text-slate-800">{cards.totalClasses}</p>
        </ScreenCard>
        <ScreenCard>
          <p className="text-xs text-slate-500">Present Count</p>
          <p className="text-xl font-bold text-slate-800">{cards.presentCount}</p>
        </ScreenCard>
      </div>
      <ScreenCard>
        <p className="mb-2 text-xs font-semibold text-slate-700">Subject-wise Attendance Summary</p>
        <div className="space-y-2">
          {Object.entries(subjectSummary).map(([name, value]) => (
            <div key={name} className="rounded-md border border-slate-200 p-2 text-xs text-slate-700">
              <p className="font-medium">{name}</p>
              <p>Sessions: {value.sessions} | Present: {value.present}</p>
            </div>
          ))}
        </div>
      </ScreenCard>
    </MobileScreen>
  );
};

const QRScanScreen = () => {
  const navigate = useNavigate();
  const { token, userId } = useAuth();
  const [sessionId, setSessionId] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const scanAndSubmit = async () => {
    try {
      await apiRequest('/session/validate', { method: 'POST', body: JSON.stringify({ session_id: sessionId }) }, token);
      await apiRequest('/attendance/mark', { method: 'POST', body: JSON.stringify({ session_id: sessionId, student_id: userId }) }, token);
      setSuccess(true);
      setMessage('Present marked successfully.');
      navigate('/student/status', { state: { success: true, message: 'Present marked successfully.' } });
    } catch (err) {
      setSuccess(false);
      const errorMessage = (err as Error).message || 'Invalid QR';
      setMessage(errorMessage);
      navigate('/student/status', { state: { success: false, message: errorMessage } });
    }
  };

  return (
    <MobileScreen title="QR Scan Screen">
      <div className="rounded-xl border border-dashed border-slate-400 bg-slate-50 p-4">
        <div className="mx-auto grid h-48 w-48 place-items-center border-4 border-slate-400">
          <div className="h-24 w-24 border-2 border-slate-500" />
        </div>
        <p className="mt-2 text-center text-xs text-slate-600">Align QR code inside scan frame</p>
      </div>
      <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Enter scanned Session ID" value={sessionId} onChange={(e) => setSessionId(e.target.value)} />
      <ActionButton text="Scan & Mark Attendance" onClick={scanAndSubmit} />
      {message && <p className={`text-xs ${success ? 'text-emerald-700' : 'text-rose-700'}`}>{message}</p>}
    </MobileScreen>
  );
};

const AttendanceStatusScreen = () => {
  const location = useLocation();
  const state = location.state as { success?: boolean; message?: string } | null;
  const success = Boolean(state?.success);

  return (
    <MobileScreen title="Attendance Status Screen">
      <ScreenCard>
        <p className={`text-center text-lg font-semibold ${success ? 'text-emerald-700' : 'text-rose-700'}`}>
          {success ? 'Present Marked' : 'Attendance Failed'}
        </p>
        <p className="mt-2 text-center text-sm text-slate-600">{state?.message || 'Scan QR and submit attendance.'}</p>
      </ScreenCard>
      <ActionButton text="Back to Student Home" onClick={() => window.history.back()} />
    </MobileScreen>
  );
};

const StudentDashboardScreen = () => {
  const { token, userId } = useAuth();
  const [summary, setSummary] = useState({ overallPercentage: 0, totalSessions: 0, presentSessions: 0, subjects: [] as any[] });
  const [records, setRecords] = useState<any[]>([]);

  const load = async () => {
    const data = await apiRequest(`/attendance/student/${userId}`, {}, token);
    setSummary(data.summary);
    setRecords(data.records);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <MobileScreen title="Student Dashboard">
      <ScreenCard>
        <p className="text-xs text-slate-500">Overall Attendance</p>
        <p className="text-xl font-bold text-slate-800">{summary.overallPercentage}%</p>
        <p className="text-[11px] text-slate-500">
          Present {summary.presentSessions} of {summary.totalSessions} sessions
        </p>
      </ScreenCard>
      <ScreenCard>
        <p className="mb-2 text-xs font-semibold text-slate-700">Subject-wise Attendance</p>
        <div className="space-y-2">
          {summary.subjects.map((item) => (
            <div key={item.subject_id} className="rounded-md border border-slate-200 p-2 text-xs">
              <p className="font-medium">{item.sub_name}</p>
              <p>
                {item.present_sessions}/{item.total_sessions} ({item.total_sessions ? Math.round((item.present_sessions / item.total_sessions) * 100) : 0}%)
              </p>
            </div>
          ))}
        </div>
      </ScreenCard>
      <ScreenCard>
        <p className="mb-2 text-xs font-semibold text-slate-700">Attendance History</p>
        <div className="max-h-44 space-y-2 overflow-auto">
          {records.map((row) => (
            <div key={`${row.session_id}-${row.date}-${row.time}`} className="rounded border border-slate-200 p-2 text-[11px]">
              <p className="font-medium">{row.sub_name}</p>
              <p>{row.date} {row.time}</p>
            </div>
          ))}
        </div>
      </ScreenCard>
    </MobileScreen>
  );
};

const ProtectedRoute = ({ role, element }: { role: Role; element: ReactElement }) => {
  const auth = useAuth();
  if (!auth.token || auth.role !== role) return <Navigate to="/login" replace />;
  return element;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<SplashScreen />} />
    <Route path="/login" element={<LoginScreen />} />

    <Route path="/faculty/home" element={<ProtectedRoute role="faculty" element={<FacultyHomeScreen />} />} />
    <Route path="/faculty/start" element={<ProtectedRoute role="faculty" element={<StartAttendanceScreen />} />} />
    <Route path="/faculty/qr" element={<ProtectedRoute role="faculty" element={<QRCodeDisplayScreen />} />} />
    <Route path="/faculty/manual" element={<ProtectedRoute role="faculty" element={<ManualAttendanceScreen />} />} />
    <Route path="/faculty/dashboard" element={<ProtectedRoute role="faculty" element={<FacultyDashboardScreen />} />} />

    <Route path="/student/home" element={<ProtectedRoute role="student" element={<StudentHomeScreen />} />} />
    <Route path="/student/scan" element={<ProtectedRoute role="student" element={<QRScanScreen />} />} />
    <Route path="/student/status" element={<ProtectedRoute role="student" element={<AttendanceStatusScreen />} />} />
    <Route path="/student/dashboard" element={<ProtectedRoute role="student" element={<StudentDashboardScreen />} />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
