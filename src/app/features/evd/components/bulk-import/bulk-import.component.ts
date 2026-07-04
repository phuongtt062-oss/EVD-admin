import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { DocumentImportService } from '../../services/document-import.service';

@Component({
  selector: 'app-bulk-import',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <p class="bulk-import__hint">
      Chọn file <strong>CSV</strong> hoặc <strong>Excel (.xlsx)</strong> với các cột
      <code>code, title, category, status</code>.
    </p>

    <div
      class="bulk-import__dropzone"
      [class.bulk-import__dropzone--active]="dragOver()"
      (dragover)="onDragOver($event)"
      (dragleave)="dragOver.set(false)"
      (drop)="onDrop($event)"
    >
      <input
        #fileInput
        type="file"
        accept=".csv,.xlsx,.xls"
        class="file-input-hidden"
        [disabled]="importFlow.importProcessing()"
        (change)="onFileChange($event)"
      />
      <div class="bulk-import__dropzone-inner">
        <p>Kéo thả hoặc chọn file để import</p>
        <button type="button" class="btn" [disabled]="importFlow.importProcessing()" (click)="fileInput.click()">
          Chọn file
        </button>
      </div>
    </div>

    <div class="bulk-import__samples">
      File mẫu:
      <a href="assets/sample-import.csv" download>CSV</a>
      <a href="assets/sample-import-100.csv" download>CSV (100)</a>
      <a href="assets/sample-import.xlsx" download>Excel</a>
    </div>

    @if (importFlow.importProcessing() && importFlow.importProgress(); as p) {
      <div class="bulk-import__progress">
        <div class="bulk-import__progress-head">
          <span>{{ p.message }}</span>
          <span>{{ p.percent }}%</span>
        </div>
        <div class="bulk-import__bar"><div class="bulk-import__fill" [style.width.%]="p.percent"></div></div>
        <p class="bulk-import__meta">
          Phân tích {{ p.parsed | number }} · Upload {{ p.uploaded | number }}/{{ p.total | number }} · OK
          {{ p.success | number }} · Lỗi {{ p.failed | number }}
        </p>
        <button type="button" class="btn btn--outline btn--sm" (click)="importFlow.cancelImport()">Huỷ</button>
      </div>
    }

    @if (importFlow.importResult(); as r) {
      <div class="alert" [class.alert--warn]="r.failed > 0" [class.alert--success]="r.failed === 0">
        Tổng {{ r.total | number }} · Thành công {{ r.success | number }} · Lỗi {{ r.failed | number }}
      </div>

      @if (r.errors.length) {
        <div class="bulk-import__errors">
          <strong>Dòng lỗi ({{ r.errors.length | number }})</strong>
          @for (row of r.errors; track row.row) {
            <div class="bulk-import__error-row">
              <span>Dòng {{ row.row }}</span>
              <span>{{ row.data['code'] }} · {{ row.data['title'] }}</span>
              <span class="field-error">{{ row.errors.join('; ') }}</span>
            </div>
          }
        </div>
      }
    }

    <div class="bulk-import__footer">
      <button type="button" class="btn btn--outline" [disabled]="importFlow.importProcessing()" (click)="importFlow.closeImport()">
        Đóng
      </button>
    </div>
  `,
  styles: `
    .bulk-import__hint {
      margin: 0 0 16px;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .bulk-import__dropzone {
      margin-bottom: 12px;
      border: 1.5px dashed var(--border);
      border-radius: 14px;
      background: #fafbfc;

      &--active {
        border-color: var(--color-primary);
        background: color-mix(in srgb, var(--color-primary) 5%, #fff);
      }
    }

    .bulk-import__dropzone-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 28px 20px;
      text-align: center;
    }

    .bulk-import__samples {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 12px;
      margin-bottom: 16px;
      font-size: 0.85rem;
    }

    .bulk-import__samples a {
      color: var(--color-primary);
      font-weight: 600;
    }

    .bulk-import__progress {
      margin-bottom: 16px;
      padding: 14px;
      border: 1px solid var(--border);
      border-radius: 12px;
    }

    .bulk-import__progress-head {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 0.88rem;
      font-weight: 600;
    }

    .bulk-import__bar {
      height: 8px;
      border-radius: 999px;
      background: #eee;
      overflow: hidden;
    }

    .bulk-import__fill {
      height: 100%;
      background: var(--color-primary);
      transition: width 0.2s;
    }

    .bulk-import__meta {
      margin: 10px 0;
      font-size: 0.82rem;
      color: var(--text-secondary);
    }

    .bulk-import__errors {
      max-height: 240px;
      overflow: auto;
      border: 1px solid var(--border);
      border-radius: 10px;
    }

    .bulk-import__errors strong {
      display: block;
      padding: 10px 12px;
      background: #f5f6f8;
    }

    .bulk-import__error-row {
      display: grid;
      grid-template-columns: 5rem 1fr 1.2fr;
      gap: 12px;
      padding: 10px 12px;
      border-top: 1px solid var(--border);
      font-size: 0.88rem;
    }

    .bulk-import__footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }
  `,
})
export class BulkImportComponent {
  readonly importFlow = inject(DocumentImportService);
  readonly dragOver = signal(false);

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.importFlow.bulkImportFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.importFlow.importProcessing()) this.dragOver.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    if (!this.importFlow.importProcessing() && event.dataTransfer?.files?.[0]) {
      this.importFlow.bulkImportFile(event.dataTransfer.files[0]);
    }
  }
}
