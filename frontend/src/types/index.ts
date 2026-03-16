export type Role = 'teacher' | 'student';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Course {
  id: number;
  name: string;
  code: string;
}

export interface SessionResponse {
  id: number;
  title: string;
  qrToken: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  expiresAt: string;
  qrDataUrl: string;
}
