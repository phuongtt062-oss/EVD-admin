import { Component, ViewEncapsulation, effect, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  readonly toast = inject(ToastService);
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      if (!this.toast.isOpen()) {
        if (this.dismissTimer) {
          clearTimeout(this.dismissTimer);
          this.dismissTimer = null;
        }
        return;
      }

      const duration = this.toast.duration();
      if (this.dismissTimer) clearTimeout(this.dismissTimer);
      this.dismissTimer = setTimeout(() => this.toast.onDismiss(), duration);
    });
  }
}
