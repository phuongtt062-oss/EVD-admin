import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ROLE_STAFF } from '../../../core/constants/app.constant';
import { AuthUser } from '../../../core/models/api.model';

@Component({
  selector: 'app-app-header',
  standalone: true,
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss',
})
export class AppHeaderComponent {
  @Input() user: AuthUser | null = null;

  @Output() menuToggle = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  onToggleMenu(): void {
    this.menuToggle.emit();
  }

  onLogout(): void {
    this.logout.emit();
  }

  roleBadgeClass(): string {
    return this.user?.role === ROLE_STAFF ? 'badge--warn' : 'badge--success';
  }
}
