import type { UserRole } from '../constants/app.constant';

export interface AuthUser {
  username: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}
