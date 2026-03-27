import { createContext, useContext, useMemo, useState } from 'react';

type Role = 'faculty' | 'student' | null;

type AuthState = {
  token: string;
  userId: number;
  role: Role;
  name: string;
};

const defaultState: AuthState = { token: '', userId: 0, role: null, name: '' };

const AuthContext = createContext({
  ...defaultState,
  login: (_token: string, _userId: number, _role: Role, _name: string) => {},
  logout: () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>(() => {
    const raw = localStorage.getItem('attendance-auth');
    return raw ? JSON.parse(raw) : defaultState;
  });

  const value = useMemo(
    () => ({
      ...state,
      login: (token: string, userId: number, role: Role, name: string) => {
        const next = { token, userId, role, name };
        localStorage.setItem('attendance-auth', JSON.stringify(next));
        setState(next);
      },
      logout: () => {
        localStorage.removeItem('attendance-auth');
        setState(defaultState);
      }
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
