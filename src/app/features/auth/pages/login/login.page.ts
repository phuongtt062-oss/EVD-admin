import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { APP_ROUTES, DEMO_USERS, ROLE_ADMIN, ROLE_STAFF, UserRole } from '../../../../core/constants/app.constant';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly demoUsers = DEMO_USERS;
  readonly ROLE_ADMIN = ROLE_ADMIN;
  readonly ROLE_STAFF = ROLE_STAFF;

  onSubmit(): void {
    if (!this.username.trim() || !this.password) {
      this.error.set('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl(APP_ROUTES.DOCUMENTS);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.error.set(err.message);
      },
    });
  }

  fillDemo(role: UserRole): void {
    const account = DEMO_USERS.find((user) => user.role === role);
    if (!account) return;
    this.username = account.username;
    this.password = account.password;
    this.error.set(null);
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }
}
