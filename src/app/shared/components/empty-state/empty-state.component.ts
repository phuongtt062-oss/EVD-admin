import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state">
      <div class="empty-state__icon" aria-hidden="true">📄</div>
      <h3 class="empty-state__title">{{ title() }}</h3>
      <p class="empty-state__desc">{{ description() }}</p>
    </div>
  `,
  styles: `
    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--text-secondary, #666);
    }

    .empty-state__icon {
      font-size: 2.5rem;
      margin-bottom: 12px;
    }

    .empty-state__title {
      margin: 0 0 8px;
      color: var(--text-primary, #1d1d1d);
      font-size: 1.1rem;
    }

    .empty-state__desc {
      margin: 0;
      font-size: 0.9rem;
    }
  `,
})
export class EmptyStateComponent {
  readonly title = input('Không có dữ liệu');
  readonly description = input('Chưa có tài liệu nào phù hợp với bộ lọc hiện tại.');
}
