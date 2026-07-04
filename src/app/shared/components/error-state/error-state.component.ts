import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  template: `
    <div class="error-state">
      <div class="error-state__icon" aria-hidden="true">⚠️</div>
      <h3 class="error-state__title">Đã xảy ra lỗi</h3>
      <p class="error-state__desc">{{ message() }}</p>
      @if (showRetry()) {
        <button type="button" class="btn" (click)="retry.emit()">Thử lại</button>
      }
    </div>
  `,
  styles: `
    .error-state {
      text-align: center;
      padding: 48px 24px;
    }

    .error-state__icon {
      font-size: 2.5rem;
      margin-bottom: 12px;
    }

    .error-state__title {
      margin: 0 0 8px;
      color: var(--color-danger, #dc3545);
    }

    .error-state__desc {
      margin: 0 0 16px;
      color: var(--text-secondary, #666);
    }
  `,
})
export class ErrorStateComponent {
  readonly message = input('');
  readonly showRetry = input(true);
  readonly retry = output<void>();
}
