import { Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { readApiError } from '../../../core/utils/api-error.util';
import { BulkImportResult, ImportProgress } from '../models/document.model';
import { ToastService } from '../../../core/services/toast.service';
import { DocumentListService } from './document-list.service';
import { ImportOrchestratorService } from './import-orchestrator.service';

@Injectable({ providedIn: 'root' })
export class DocumentImportService {
  private readonly list = inject(DocumentListService);
  private readonly importOrchestrator = inject(ImportOrchestratorService);
  private readonly toast = inject(ToastService);
  private importSub?: Subscription;

  readonly importOpen = signal(false);
  readonly importProcessing = signal(false);
  readonly importProgress = signal<ImportProgress | null>(null);
  readonly importResult = signal<BulkImportResult | null>(null);

  openImport(): void {
    this.resetImportState();
    this.importOpen.set(true);
  }

  closeImport(): void {
    if (this.importProcessing()) {
      this.importSub?.unsubscribe();
      this.importOrchestrator.cancel();
    }
    this.importOpen.set(false);
    this.resetImportState();
  }

  bulkImportFile(file: File): void {
    this.resetImportState();
    this.importProcessing.set(true);
    this.importProgress.set({
      phase: 'parsing',
      parsed: 0,
      uploaded: 0,
      total: 0,
      success: 0,
      failed: 0,
      percent: 0,
      message: 'Đang bắt đầu...',
    });

    this.importSub?.unsubscribe();
    this.importSub = this.importOrchestrator.run(file).subscribe({
      next: (event) => {
        if (event.kind === 'progress') {
          this.importProgress.set(event.progress);
          return;
        }

        this.importResult.set(event.result);
        this.list.loadDocuments();
        if (event.result.success > 0) {
          this.toast.success(
            `Import xong: ${event.result.success.toLocaleString()} thành công, ${event.result.failed.toLocaleString()} lỗi`
          );
        } else {
          this.toast.error('Không import được dòng nào');
        }
      },
      error: (err) => {
        this.resetImportState();
        this.toast.error(readApiError(err, 'Import thất bại'));
      },
      complete: () => this.importProcessing.set(false),
    });
  }

  cancelImport(): void {
    this.importSub?.unsubscribe();
    this.importOrchestrator.cancel();
    this.resetImportState();
  }

  private resetImportState(): void {
    this.importProcessing.set(false);
    this.importProgress.set(null);
    this.importResult.set(null);
  }
}
