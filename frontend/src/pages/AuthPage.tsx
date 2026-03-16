import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import { MobileShell } from '../components/MobileShell';

export const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isRegister = location.pathname === '/register';
  const { login, register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (submissionError) {
      setError((submissionError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileShell
      title={isRegister ? 'Create your account' : 'Welcome back'}
      subtitle={isRegister ? 'Join as teacher or student to get started.' : 'Login to continue attendance workflow.'}
    >
      <div className="mb-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-sm font-semibold">
        <Link to="/login" className={`rounded-xl px-3 py-2 text-center ${!isRegister ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
          Login
        </Link>
        <Link to="/register" className={`rounded-xl px-3 py-2 text-center ${isRegister ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
          Register
        </Link>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {isRegister && (
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400"
            placeholder="Full name"
            required
          />
        )}
        <input
          value={email}
          type="email"
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400"
          placeholder="Email address"
          required
        />
        <input
          value={password}
          type="password"
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400"
          placeholder="Password"
          required
        />
        {isRegister && (
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        )}

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button disabled={loading} className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">
          {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
        </button>
      </form>
    </MobileShell>
  );
};
