import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [FormsModule],
  template: `
    <nav class="pagination" aria-label="Phân trang">
      <div class="pagination__info">
        Trang {{ page() }} / {{ totalPages() }} · Tổng số {{ total() }} item
      </div>
      <div class="pagination__controls">
        <label class="pagination__size">
          Hiển thị
          <select
            class="field-native-select pagination__select"
            [ngModel]="pageSize()"
            (ngModelChange)="pageSizeChange.emit($event)"
          >
            @for (size of sizeOptions(); track size) {
              <option [ngValue]="size">{{ size }}</option>
            }
          </select>
        </label>
        <button type="button" class="btn btn--outline pagination__btn" [disabled]="page() <= 1" (click)="pageChange.emit(page() - 1)">
          Trước
        </button>
        <button
          type="button"
          class="btn btn--outline pagination__btn"
          [disabled]="page() >= totalPages()"
          (click)="pageChange.emit(page() + 1)"
        >
          Sau
        </button>
      </div>
    </nav>
  `,
  styles: `
    .pagination {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 0;
    }

    .pagination__info {
      font-size: 0.85rem;
      color: var(--text-secondary, #666);
    }

    .pagination__controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .pagination__size {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: var(--text-secondary, #666);
    }

    .pagination__select {
      width: auto;
      min-height: 36px;
      padding: 4px 8px;
    }

    .pagination__btn {
      min-height: 36px;
      padding: 0 14px;
      font-size: 0.85rem;
    }
  `,
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly total = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageSizeOptions = input<number[]>([10, 20, 50]);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly sizeOptions = computed(() => {
    const options = [...this.pageSizeOptions()];
    const current = this.pageSize();

    if (!options.includes(current)) {
      options.push(current);
      options.sort((a, b) => a - b);
    }

    return options;
  });
}
