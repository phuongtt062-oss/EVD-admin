import { Component } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `<span class="app-spinner" aria-hidden="true"></span>`,
  styles: `
    :host {
      display: inline-flex;
    }

    .app-spinner {
      display: block;
      width: 24px;
      height: 24px;
      border: 2.5px solid color-mix(in srgb, var(--color-primary, #00994f) 20%, transparent);
      border-top-color: var(--color-primary, #00994f);
      border-radius: 50%;
      animation: app-spinner-spin 0.75s linear infinite;
    }

    @keyframes app-spinner-spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class SpinnerComponent {}
