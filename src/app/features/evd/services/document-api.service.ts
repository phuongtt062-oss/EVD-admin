import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import { APP_API_PATHS } from '../../../core/constants/app.constant';
import { DocumentFieldKey } from '../constants/document.constant';
import {
  BulkImportResult,
  Document,
  PaginatedResponse,
  DocumentQuery,
} from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class DocumentApiService extends BaseApiService {
  private readonly path = APP_API_PATHS.DOCUMENTS;

  getDocuments(query: DocumentQuery): Observable<PaginatedResponse<Document>> {
    return this.get<PaginatedResponse<Document>>(this.path, query);
  }

  createDocument(payload: Pick<Document, DocumentFieldKey>): Observable<Document> {
    return this.post<Document>(this.path, payload);
  }

  updateDocument(id: string, payload: Partial<Document>): Observable<Document> {
    return this.put<Document>(`${this.path}/${id}`, payload);
  }

  deleteDocument(id: string): Observable<void> {
    return this.delete<void>(`${this.path}/${id}`);
  }

  bulkImport(rows: Record<string, unknown>[]): Observable<BulkImportResult> {
    return this.post<BulkImportResult>(`${this.path}/bulk-import`, { rows });
  }
}
