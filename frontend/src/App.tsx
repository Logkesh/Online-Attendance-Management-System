import { FormEvent, ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { apiRequest } from './services/api';

type Role = 'faculty' | 'student';

type SessionResponse = {
  session_id: string;
  qrcode: string;
  qr_image: string;
  class_id: number;
  subject_id: number;
  faculty_id: number;
  starttime: string;
  endtime: string;
  date: string;
  allowed_radius_m: number;
  expires_in_seconds: number;
  created_at?: number;
};

type Student = { student_id: number; stud_name: string; stud_username: string };

type ScanState = { success: boolean; message: string };

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options: { formats: string[] }): {
        detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>>;
      };
      getSupportedFormats?: () => Promise<string[]>;
    };
  }
}

const MobileScreen = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-sky-50 to-fuchsia-100 px-4 py-6">
      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/50 bg-white/80 shadow-2xl backdrop-blur">
        <header className="flex items-center justify-between border-b border-slate-200/70 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-white">
          <h1 className="text-sm font-semibold tracking-wide">{title}</h1>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">{location.pathname}</span>
        </header>
        <main className="space-y-4 p-4">{children}</main>
      </div>
    </div>
  );
};

const ActionButton = ({ text, onClick, variant = 'default' }: { text: string; onClick: () => void; variant?: 'default' | 'danger' | 'muted' }) => {
  const style = variant === 'danger' ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md' : variant === 'muted' ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md';
  return (
    <button className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:scale-[1.01] ${style}`} onClick={onClick}>
      {text}
    </button>
  );
};

const ScreenCard = ({ children }: { children: React.ReactNode }) => <div className="rounded-2xl border border-indigo-100 bg-white/90 p-3 shadow-sm">{children}</div>;

const getCurrentLocation = async () =>
  new Promise<{ lat: number; lng: number }>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => reject(new Error('Location access is required')),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/login', { replace: true }), 1000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <MobileScreen title="Splash Screen">
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-white shadow-lg ring-4 ring-indigo-200 text-2xl text-indigo-700">QR</div>
        <p className="text-center text-sm font-bold text-indigo-900">QR Code and Location-Based Smart Attendance</p>
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
        <select className="w-full rounded-xl border border-indigo-200 bg-white/90 px-3 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="faculty">Faculty</option>
          <option value="student">Student</option>
        </select>
        <input className="w-full rounded-xl border border-indigo-200 bg-white/90 px-3 py-2 text-sm" placeholder="Email / ID" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="w-full rounded-xl border border-indigo-200 bg-white/90 px-3 py-2 text-sm" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <button className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2.5 text-sm font-semibold text-white shadow-md" type="submit">Login</button>
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
  const [radius, setRadius] = useState(100);
  const [message, setMessage] = useState('');

  const startSession = async () => {
    try {
      setMessage('Capturing faculty location...');
      const location = await getCurrentLocation();
      const data = (await apiRequest(
        '/session/create',
        {
          method: 'POST',
          body: JSON.stringify({
            subject_id: subjectId,
            class_id: classId,
            faculty_id: userId,
            faculty_lat: location.lat,
            faculty_lng: location.lng,
            allowed_radius_m: radius
          })
        },
        token
      )) as SessionResponse;

      const sessionWithMeta = { ...data, created_at: Date.now() };
      localStorage.setItem('active-session', JSON.stringify(sessionWithMeta));
      navigate('/faculty/qr');
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  return (
    <MobileScreen title="Start Attendance Screen">
      <ScreenCard>
        <label className="mb-1 block text-xs text-slate-500">Select Class</label>
        <select className="w-full rounded-xl border border-indigo-200 bg-white/90 px-3 py-2 text-sm" value={classId} onChange={(e) => setClassId(Number(e.target.value))}>
          <option value={1}>CSE-A</option>
        </select>
      </ScreenCard>
      <ScreenCard>
        <label className="mb-1 block text-xs text-slate-500">Select Subject</label>
        <select className="w-full rounded-xl border border-indigo-200 bg-white/90 px-3 py-2 text-sm" value={subjectId} onChange={(e) => setSubjectId(Number(e.target.value))}>
          <option value={1}>Data Structures</option>
        </select>
      </ScreenCard>
      <input className="w-full rounded-xl border border-indigo-200 bg-white/90 px-3 py-2 text-sm" type="number" min={10} value={radius} onChange={(e) => setRadius(Number(e.target.value))} placeholder="Allowed radius (meters)" />
      <ActionButton text="Start Session" onClick={startSession} />
      {message && <p className="text-xs text-slate-600">{message}</p>}
    </MobileScreen>
  );
};

const QRCodeDisplayScreen = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionResponse | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('active-session');
    if (raw) setSession(JSON.parse(raw));
  }, []);

  const [liveSeconds, setLiveSeconds] = useState(0);

  useEffect(() => {
    if (!session) return;
    const startedAt = session.created_at || Date.now();
    const refresh = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setLiveSeconds(Math.max(0, 300 - elapsed));
    };

    refresh();
    const interval = setInterval(refresh, 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session) {
    return (
      <MobileScreen title="QR Code Display Screen">
        <p className="text-sm text-slate-600">No active session found.</p>
        <ActionButton text="Back to Start Session" onClick={() => navigate('/faculty/start')} />
      </MobileScreen>
    );
  }

  const mins = `${Math.floor(liveSeconds / 60)}`.padStart(2, '0');
  const secs = `${liveSeconds % 60}`.padStart(2, '0');

  return (
    <MobileScreen title="QR Code Display Screen">
      <ScreenCard>
        <img src={session.qr_image} alt="Generated attendance QR" className="mx-auto h-64 w-64 border border-slate-300 p-2" />
      </ScreenCard>
      <p className="text-center text-sm font-medium text-slate-800">QR valid for: {mins}:{secs}</p>
      <ActionButton text="Manual Attendance" variant="muted" onClick={() => navigate('/faculty/manual')} />
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
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [status, setStatus] = useState('');
  const session = useMemo(() => {
    const raw = localStorage.getItem('active-session');
    return raw ? (JSON.parse(raw) as SessionResponse) : null;
  }, []);

  const loadStudents = async () => {
    if (!session) return;
    try {
      const list = await apiRequest(`/attendance/class/${session.class_id}/students`, {}, token);
      setStudents(list);
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const saveManualAttendance = async () => {
    if (!session) {
      setStatus('No active session found.');
      return;
    }

    const selectedStudents = students.filter((s) => selected[s.student_id]);
    if (selectedStudents.length === 0) {
      setStatus('Select at least one student.');
      return;
    }

    try {
      const response = await apiRequest('/attendance/manual-mark', {
        method: 'POST',
        body: JSON.stringify({ session_id: session.session_id, student_ids: selectedStudents.map((s) => s.student_id) })
      }, token);
      setStatus(`Marked ${response.marked}/${selectedStudents.length} students as present.`);
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  return (
    <MobileScreen title="Manual Attendance Screen">
      {session && <p className="rounded-lg bg-slate-100 p-2 text-[11px]">Session: {session.session_id.slice(0, 10)}...</p>}
      <div className="max-h-72 space-y-2 overflow-auto rounded-lg border border-slate-200 p-2">
        {students.map((student) => (
          <label key={student.student_id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <span>{student.stud_name}</span>
            <input
              type="checkbox"
              checked={Boolean(selected[student.student_id])}
              onChange={(e) => setSelected((prev) => ({ ...prev, [student.student_id]: e.target.checked }))}
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
        <ScreenCard><p className="text-xs text-slate-500">Total Classes</p><p className="text-xl font-bold text-slate-800">{cards.totalClasses}</p></ScreenCard>
        <ScreenCard><p className="text-xs text-slate-500">Present Count</p><p className="text-xl font-bold text-slate-800">{cards.presentCount}</p></ScreenCard>
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [message, setMessage] = useState('Initializing camera...');
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frameHandle: number | null = null;
    let detector: { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>> } | null = null;

    const scanFrame = async () => {
      if (!videoRef.current || !detector || !scanning) {
        frameHandle = requestAnimationFrame(scanFrame);
        return;
      }

      try {
        const result = await detector.detect(videoRef.current);
        if (result.length > 0 && result[0].rawValue) {
          setScanning(false);
          const payload = JSON.parse(result[0].rawValue);
          const location = await getCurrentLocation();
          await apiRequest('/attendance/mark', {
            method: 'POST',
            body: JSON.stringify({ session_id: payload.session_id, student_id: userId, student_lat: location.lat, student_lng: location.lng })
          }, token);
          navigate('/student/status', { state: { success: true, message: 'Present marked successfully.' } satisfies ScanState });
          return;
        }
      } catch {
        // keep scanning
      }

      frameHandle = requestAnimationFrame(scanFrame);
    };

    const start = async () => {
      try {
        if (!window.BarcodeDetector) throw new Error('QR scanner not supported on this device/browser.');
        detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setMessage('Point camera at attendance QR');
        frameHandle = requestAnimationFrame(scanFrame);
      } catch (err) {
        setMessage((err as Error).message || 'Unable to access camera');
      }
    };

    start();

    return () => {
      if (frameHandle != null) cancelAnimationFrame(frameHandle);
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [navigate, scanning, token, userId]);

  return (
    <MobileScreen title="QR Scan Screen">
      <div className="relative overflow-hidden rounded-xl border border-dashed border-slate-400 bg-black">
        <video ref={videoRef} className="h-64 w-full object-cover" muted playsInline />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="h-36 w-36 border-4 border-white/90" />
        </div>
      </div>
      <p className="text-center text-xs text-slate-600">{message}</p>
      <ActionButton
        text="Mark Failure / Retry"
        variant="muted"
        onClick={() => navigate('/student/status', { state: { success: false, message: 'Outside location / Invalid QR / Scan failed' } satisfies ScanState })}
      />
    </MobileScreen>
  );
};

const AttendanceStatusScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ScanState | null;
  const success = Boolean(state?.success);

  return (
    <MobileScreen title="Attendance Status Screen">
      <ScreenCard>
        <p className={`text-center text-lg font-semibold ${success ? 'text-emerald-700' : 'text-rose-700'}`}>{success ? 'Present Marked' : 'Attendance Failed'}</p>
        <p className="mt-2 text-center text-sm text-slate-600">{state?.message || 'Scan QR and submit attendance.'}</p>
      </ScreenCard>
      <ActionButton text="Back to Student Home" onClick={() => navigate('/student/home')} />
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
        <p className="text-[11px] text-slate-500">Present {summary.presentSessions} of {summary.totalSessions} sessions</p>
      </ScreenCard>
      <ScreenCard>
        <p className="mb-2 text-xs font-semibold text-slate-700">Subject-wise Attendance</p>
        <div className="space-y-2">
          {summary.subjects.map((item) => (
            <div key={item.subject_id} className="rounded-md border border-slate-200 p-2 text-xs">
              <p className="font-medium">{item.sub_name}</p>
              <p>{item.present_sessions}/{item.total_sessions} ({item.total_sessions ? Math.round((item.present_sessions / item.total_sessions) * 100) : 0}%)</p>
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
