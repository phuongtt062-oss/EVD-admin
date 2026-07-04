export type DocumentStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type DocumentCategory = 'CONTRACT' | 'INVOICE' | 'REPORT';

export interface Document {
  id: string;
  code: string;
  title: string;
  category: DocumentCategory;
  status: DocumentStatus;
  createdBy: string;
  createdDate: string;
}

export interface DocumentQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: DocumentStatus | '';
  category?: DocumentCategory | '';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DocumentFormValue {
  code: string;
  title: string;
  category: DocumentCategory | '';
  status: DocumentStatus | '';
}

export interface BulkImportError {
  row: number;
  data: Record<string, unknown>;
  errors: string[];
}

export interface BulkImportResult {
  total: number;
  success: number;
  failed: number;
  errors: BulkImportError[];
}

export interface ImportProgress {
  phase: 'parsing' | 'uploading' | 'done';
  parsed: number;
  uploaded: number;
  total: number;
  success: number;
  failed: number;
  percent: number;
  message: string;
}
