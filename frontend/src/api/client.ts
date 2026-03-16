const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const apiFetch = async <T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};
