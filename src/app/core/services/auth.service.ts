import { Injectable, computed, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { APP_ROUTES, DEMO_USERS, ROLE_ADMIN, ROLE_STAFF, STORAGE_KEYS } from '../constants/app.constant';
import { AuthUser, LoginRequest } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly demoUsers = new Map<string, { password: string; user: AuthUser }>(
    DEMO_USERS.map((user) => [
      user.username as string,
      {
        password: user.password,
        user: { username: user.username, email: user.email, role: user.role },
      },
    ])
  );

  readonly user = signal<AuthUser | null>(null);
  readonly isStaff = computed(() => this.user()?.role === ROLE_STAFF);
  readonly canDelete = computed(() => this.user()?.role === ROLE_ADMIN);

  constructor() {
    this.restoreSession();
  }

  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.SESSION);
  }

  isAuthenticated(): boolean {
    return !!this.user();
  }

  login(payload: LoginRequest): Observable<AuthUser> {
    const matched = this.demoUsers.get(payload.username);
    if (!matched || matched.password !== payload.password) {
      return throwError(() => new Error('Sai tên đăng nhập hoặc mật khẩu'));
    }

    const token = btoa(JSON.stringify(matched.user));
    localStorage.setItem(STORAGE_KEYS.SESSION, token);
    this.user.set(matched.user);
    return of(matched.user);
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    this.user.set(null);
    window.location.assign(APP_ROUTES.LOGIN);
  }

  private restoreSession(): void {
    const token = this.getAccessToken();
    if (!token) return;

    try {
      this.user.set(JSON.parse(atob(token)) as AuthUser);
    } catch {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }
}
