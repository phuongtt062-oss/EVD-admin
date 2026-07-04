import { Injectable, inject, signal } from '@angular/core';
import { readApiError } from '../../../core/utils/api-error.util';
import { Document, DocumentFormValue } from '../models/document.model';
import { toDocumentPayload } from '../utils/document.util';
import { DocumentApiService } from './document-api.service';
import { DocumentListService } from './document-list.service';

@Injectable({ providedIn: 'root' })
export class DocumentActionsService {
  private readonly api = inject(DocumentApiService);
  private readonly list = inject(DocumentListService);

  readonly formOpen = signal(false);
  readonly deleteTarget = signal<Document | null>(null);

  openCreateForm(): void {
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  saveForm(form: DocumentFormValue, onSuccess: () => void, onError: (msg: string) => void): void {
    this.api.createDocument(toDocumentPayload(form)).subscribe({
      next: () => {
        this.closeForm();
        this.list.loadDocuments();
        onSuccess();
      },
      error: (err) => onError(readApiError(err, 'Lưu thất bại')),
    });
  }

  openDeleteConfirm(doc: Document): void {
    this.deleteTarget.set(doc);
  }

  closeDeleteConfirm(): void {
    this.deleteTarget.set(null);
  }

  confirmDelete(onSuccess: () => void, onError: (msg: string) => void): void {
    const target = this.deleteTarget();
    if (!target) return;

    this.api.deleteDocument(target.id).subscribe({
      next: () => {
        this.closeDeleteConfirm();
        this.list.loadDocuments();
        onSuccess();
      },
      error: (err) => onError(readApiError(err, 'Xóa thất bại')),
    });
  }
}
