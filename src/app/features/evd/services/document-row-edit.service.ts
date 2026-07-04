import { Injectable, computed, inject, signal } from '@angular/core';
import { readApiError } from '../../../core/utils/api-error.util';
import { Document } from '../models/document.model';
import { toDocumentPayload } from '../utils/document.util';
import { DocumentFieldKey, validateDocumentDraft, validateDocumentField } from '../utils/document-validation';
import { DocumentApiService } from './document-api.service';
import { DocumentListService } from './document-list.service';

export interface RowEditState {
  documentId: string;
  editing: boolean;
  draft: Pick<Document, DocumentFieldKey>;
  dirtyFields: Set<DocumentFieldKey>;
  fieldErrors: Partial<Record<DocumentFieldKey, string>>;
  saving: boolean;
}

@Injectable({ providedIn: 'root' })
export class DocumentRowEditService {
  private readonly api = inject(DocumentApiService);
  private readonly list = inject(DocumentListService);

  readonly rowEdits = signal<Map<string, RowEditState>>(new Map());
  readonly bulkSaving = signal(false);

  readonly dirtyRowCount = computed(() => {
    let count = 0;
    for (const row of this.rowEdits().values()) {
      if (row.dirtyFields.size > 0) count++;
    }
    return count;
  });
  readonly hasDirtyRowErrors = computed(() => {
    for (const row of this.rowEdits().values()) {
      if (row.dirtyFields.size > 0 && Object.keys(row.fieldErrors).length > 0) return true;
    }
    return false;
  });
  readonly hasUnsavedChanges = computed(() => this.dirtyRowCount() > 0);

  getRowState(doc: Document): RowEditState {
    return this.rowEdits().get(doc.id) ?? this.createRowState(doc);
  }

  isRowEditing(docId: string): boolean {
    return this.rowEdits().get(docId)?.editing ?? false;
  }

  startRowEdit(docId: string): void {
    if (this.isRowEditing(docId)) return;

    const doc = this.list.documents().find((d) => d.id === docId);
    if (!doc) return;

    this.setRowState(docId, { ...this.createRowState(doc), editing: true });
  }

  updateRowField(docId: string, field: DocumentFieldKey, value: string): void {
    if (!this.isRowEditing(docId)) return;

    const doc = this.list.documents().find((d) => d.id === docId);
    const row = this.rowEdits().get(docId);
    if (!doc || !row) return;

    const draft = { ...row.draft, [field]: value };
    const dirtyFields = new Set(row.dirtyFields);
    if (value !== doc[field]) dirtyFields.add(field);
    else dirtyFields.delete(field);

    const fieldErrors = { ...row.fieldErrors };
    const error = validateDocumentField(field, value);
    if (error) fieldErrors[field] = error;
    else delete fieldErrors[field];

    this.setRowState(docId, { ...row, draft, dirtyFields, fieldErrors });
  }

  saveRow(docId: string, onSuccess?: () => void, onError?: (msg: string) => void): void {
    const row = this.rowEdits().get(docId);
    if (!row || row.saving || row.dirtyFields.size === 0) return;

    const fieldErrors = validateDocumentDraft(row.draft);
    if (Object.keys(fieldErrors).length) {
      this.setRowState(docId, { ...row, fieldErrors });
      return;
    }

    this.setRowState(docId, { ...row, saving: true, fieldErrors: {} });

    this.api.updateDocument(docId, toDocumentPayload(row.draft)).subscribe({
      next: (updated) => {
        this.list.updateDocument(updated);
        this.setRowState(docId, this.createRowState(updated));
        onSuccess?.();
      },
      error: (err) => {
        const message = readApiError(err, 'Lưu thất bại');
        this.setRowState(docId, { ...row, saving: false, fieldErrors: { code: message } });
        onError?.(message);
      },
    });
  }

  saveAllDirtyRows(onComplete?: (result: { saved: number; failed: number }) => void): void {
    if (this.bulkSaving()) return;

    const rows = [...this.rowEdits().values()].filter((row) => row.dirtyFields.size > 0);
    if (!rows.length) return;

    for (const row of rows) {
      const fieldErrors = validateDocumentDraft(row.draft);
      if (Object.keys(fieldErrors).length) {
        this.setRowState(row.documentId, { ...row, fieldErrors });
        return;
      }
    }

    this.bulkSaving.set(true);
    let saved = 0;
    let failed = 0;
    let index = 0;

    const saveNext = (): void => {
      if (index >= rows.length) {
        this.bulkSaving.set(false);
        onComplete?.({ saved, failed });
        return;
      }

      const row = rows[index++];
      this.setRowState(row.documentId, { ...row, saving: true, fieldErrors: {} });

      this.api.updateDocument(row.documentId, toDocumentPayload(row.draft)).subscribe({
        next: (updated) => {
          saved++;
          this.list.updateDocument(updated);
          this.setRowState(row.documentId, this.createRowState(updated));
          saveNext();
        },
        error: (err) => {
          failed++;
          const message = readApiError(err, 'Lưu thất bại');
          const current = this.rowEdits().get(row.documentId) ?? row;
          this.setRowState(row.documentId, { ...current, saving: false, fieldErrors: { code: message } });
          saveNext();
        },
      });
    };

    saveNext();
  }

  cancelRow(docId: string): void {
    const doc = this.list.documents().find((d) => d.id === docId);
    if (doc) this.setRowState(docId, this.createRowState(doc));
  }

  cancelAllDirtyRows(): void {
    const next = new Map<string, RowEditState>();
    for (const doc of this.list.documents()) {
      next.set(doc.id, this.createRowState(doc));
    }
    this.rowEdits.set(next);
  }

  syncWithDocuments(docs: Document[]): void {
    const prev = this.rowEdits();
    const next = new Map<string, RowEditState>();

    for (const doc of docs) {
      const existing = prev.get(doc.id);
      next.set(doc.id, existing?.dirtyFields.size ? { ...existing, editing: false } : this.createRowState(doc));
    }

    this.rowEdits.set(next);
  }

  clear(): void {
    this.rowEdits.set(new Map());
  }

  private createRowState(doc: Document): RowEditState {
    return {
      documentId: doc.id,
      editing: false,
      draft: {
        code: doc.code,
        title: doc.title,
        category: doc.category,
        status: doc.status,
      },
      dirtyFields: new Set(),
      fieldErrors: {},
      saving: false,
    };
  }

  private setRowState(docId: string, state: RowEditState): void {
    const next = new Map(this.rowEdits());
    next.set(docId, state);
    this.rowEdits.set(next);
  }
}
