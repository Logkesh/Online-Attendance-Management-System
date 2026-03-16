import { useState } from 'react';
import type { Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';

export const AuthPage = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegister) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center p-4">
      <div className="w-full rounded-3xl bg-white p-6 shadow-md">
        <h1 className="text-2xl font-bold text-slate-900">QR Attendance</h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">Login or create an account</p>
        <form onSubmit={submit}>
          {isRegister && <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />}
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {isRegister && (
            <label className="mb-4 block text-sm text-slate-700">
              <span className="mb-1 block">Role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </label>
          )}
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <button className="w-full rounded-xl bg-blue-600 py-2 text-white">{isRegister ? 'Register' : 'Login'}</button>
        </form>
        <button className="mt-4 text-sm text-blue-600" onClick={() => setIsRegister((v) => !v)}>
          {isRegister ? 'Already have an account? Login' : 'New here? Register'}
        </button>
      </div>
    </main>
  );
};
