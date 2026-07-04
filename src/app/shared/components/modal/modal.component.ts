import { Component, input, output, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ModalComponent {
  readonly isOpen = input(false);
  readonly canDismiss = input(true);
  readonly title = input('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly dismissed = output<void>();

  onBackdropClick(): void {
    if (!this.canDismiss()) return;
    this.dismissed.emit();
  }

  onCloseClick(): void {
    if (!this.canDismiss()) return;
    this.dismissed.emit();
  }

  onEscape(event: Event): void {
    if (!(event instanceof KeyboardEvent) || event.key !== 'Escape' || !this.canDismiss()) return;
    this.dismissed.emit();
  }
}
