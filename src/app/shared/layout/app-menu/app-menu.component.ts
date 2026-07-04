import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-app-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-menu.component.html',
  styleUrl: './app-menu.component.scss',
})
export class AppMenuComponent {
  @Input() items: { label: string; route?: string }[] = [];
  @Input() isOpen = false;

  @Output() closeRequested = new EventEmitter<void>();

  onClose(): void {
    this.closeRequested.emit();
  }
}
