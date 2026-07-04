import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="confirm-dialog">
      <p class="confirm-dialog__message">{{ message() }}</p>
      <div class="confirm-dialog__actions">
        <button type="button" class="btn btn--outline" (click)="cancelled.emit()">{{ cancelLabel() }}</button>
        <button
          type="button"
          class="btn confirm-dialog__confirm confirm-dialog__confirm--danger"
          (click)="confirmed.emit()"
        >
          {{ confirmLabel() }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .confirm-dialog__message {
      margin: 0 0 20px;
      color: var(--text-secondary, #666);
      line-height: 1.5;
    }

    .confirm-dialog__actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .confirm-dialog__confirm--danger {
      background: var(--color-danger, #dc3545);
      color: #ffffff;
    }

    .confirm-dialog__confirm--danger:hover:not(:disabled) {
      background: color-mix(in srgb, var(--color-danger, #dc3545) 85%, #000);
      color: #ffffff;
    }
  `,
})
export class ConfirmDialogComponent {
  readonly message = input('');
  readonly confirmLabel = input('Xác nhận');
  readonly cancelLabel = input('Huỷ');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
