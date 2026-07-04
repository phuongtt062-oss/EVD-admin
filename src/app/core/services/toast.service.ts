import { Injectable, signal } from '@angular/core';
import { ToastColor } from '../models/toast.model';

const DEFAULT_DURATION_MS = 3000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly isOpen = signal(false);
  readonly message = signal('');
  readonly color = signal<ToastColor>('success');
  readonly duration = signal(DEFAULT_DURATION_MS);

  success(message: string, duration = DEFAULT_DURATION_MS): void {
    this.open(message, 'success', duration);
  }

  error(message: string, duration = DEFAULT_DURATION_MS): void {
    this.open(message, 'danger', duration);
  }

  onDismiss(): void {
    this.isOpen.set(false);
  }

  private open(message: string, color: ToastColor, duration: number): void {
    this.message.set(message);
    this.color.set(color);
    this.duration.set(duration);
    this.isOpen.set(true);
  }
}
