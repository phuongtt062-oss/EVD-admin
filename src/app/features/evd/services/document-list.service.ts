import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { DEFAULT_PAGE_SIZE } from '../../../core/constants/app.constant';
import { readApiError } from '../../../core/utils/api-error.util';
import {
  Document,
  DocumentCategory,
  DocumentQuery,
  DocumentStatus,
} from '../models/document.model';
import { DocumentApiService } from './document-api.service';
import { DocumentRowEditService } from './document-row-edit.service';

export interface DocumentListLoadHooks {
  onSuccess?: (docs: Document[]) => void;
  onError?: () => void;
}

@Injectable({ providedIn: 'root' })
export class DocumentListService {
  private readonly api = inject(DocumentApiService);
  private readonly injector = inject(Injector);

  readonly documents = signal<Document[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly isEmpty = computed(() => !this.loading() && !this.error() && this.documents().length === 0);

  readonly page = signal(1);
  readonly pageSize = signal<number>(DEFAULT_PAGE_SIZE);
  readonly total = signal(0);
  readonly search = signal('');
  readonly statusFilter = signal<DocumentStatus | ''>('');
  readonly categoryFilter = signal<DocumentCategory | ''>('');
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  loadDocuments(hooks?: DocumentListLoadHooks): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getDocuments(this.buildQuery()).subscribe({
      next: (res) => {
        this.documents.set(res.items);
        this.total.set(res.total);
        this.syncRowEdits(res.items);
        hooks?.onSuccess?.(res.items);
      },
      error: (err) => {
        this.error.set(readApiError(err, 'Không thể tải danh sách tài liệu'));
        this.documents.set([]);
        this.total.set(0);
        this.clearRowEdits();
        hooks?.onError?.();
      },
      complete: () => this.loading.set(false),
    });
  }

  updateDocument(updated: Document): void {
    this.documents.update((docs) => docs.map((d) => (d.id === updated.id ? updated : d)));
  }

  applyPage(page: number): void {
    this.applyQueryChange(() => this.page.set(page));
  }

  applyPageSize(size: number): void {
    this.applyQueryChange(() => {
      this.pageSize.set(size);
      this.page.set(1);
    });
  }

  searchDocuments(): void {
    this.applyQueryChange(() => this.page.set(1));
  }

  resetFilters(): void {
    this.applyQueryChange(() => {
      this.search.set('');
      this.statusFilter.set('');
      this.categoryFilter.set('');
      this.page.set(1);
    });
  }

  private applyQueryChange(change: () => void): void {
    if (!this.confirmLeaveEditing()) return;
    change();
    this.loadDocuments();
  }

  private confirmLeaveEditing(): boolean {
    const rowEdit = this.injector.get(DocumentRowEditService);
    if (!rowEdit.hasUnsavedChanges()) return true;
    if (!confirm('Bạn có thay đổi chưa lưu. Tiếp tục sẽ bỏ các thay đổi này.')) {
      return false;
    }
    rowEdit.cancelAllDirtyRows();
    return true;
  }

  private buildQuery(): DocumentQuery {
    return {
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.search(),
      status: this.statusFilter(),
      category: this.categoryFilter(),
    };
  }

  private syncRowEdits(docs: Document[]): void {
    this.injector.get(DocumentRowEditService).syncWithDocuments(docs);
  }

  private clearRowEdits(): void {
    this.injector.get(DocumentRowEditService).clear();
  }
}
