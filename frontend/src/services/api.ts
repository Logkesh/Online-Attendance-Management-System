const inferApiUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:4000/api';

  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:4000/api';
  }

  return `http://${host}:4000/api`;
};

const API_URL = import.meta.env.VITE_API_URL || inferApiUrl();

export const apiRequest = async (path: string, options: RequestInit = {}, token?: string) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'API request failed');
  return data;
};

export { API_URL };
