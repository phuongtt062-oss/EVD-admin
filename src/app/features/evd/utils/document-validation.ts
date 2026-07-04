import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_FIELDS,
  DOCUMENT_STATUSES,
  DOCUMENT_VALIDATION,
  DocumentFieldKey,
} from '../constants/document.constant';
import type { DocumentCategory, DocumentStatus } from '../models/document.model';

export type { DocumentFieldKey };

export function validateDocumentField(field: DocumentFieldKey, value: string): string | null {
  switch (field) {
    case 'code': {
      if (!value?.trim()) return 'Mã tài liệu là bắt buộc';
      const len = value.trim().length;
      if (len < DOCUMENT_VALIDATION.code.min || len > DOCUMENT_VALIDATION.code.max) {
        return `Mã tài liệu phải từ ${DOCUMENT_VALIDATION.code.min}-${DOCUMENT_VALIDATION.code.max} ký tự`;
      }
      return null;
    }
    case 'title': {
      if (!value?.trim()) return 'Tiêu đề là bắt buộc';
      const len = value.trim().length;
      if (len < DOCUMENT_VALIDATION.title.min || len > DOCUMENT_VALIDATION.title.max) {
        return `Tiêu đề phải từ ${DOCUMENT_VALIDATION.title.min}-${DOCUMENT_VALIDATION.title.max} ký tự`;
      }
      return null;
    }
    case 'category':
      return DOCUMENT_CATEGORIES.includes(value as DocumentCategory) ? null : 'Danh mục không hợp lệ';
    case 'status':
      return DOCUMENT_STATUSES.includes(value as DocumentStatus) ? null : 'Trạng thái không hợp lệ';
    default:
      return null;
  }
}

export function validateDocumentDraft(draft: { [K in DocumentFieldKey]: string }): Partial<Record<DocumentFieldKey, string>> {
  const errors: Partial<Record<DocumentFieldKey, string>> = {};
  for (const field of DOCUMENT_FIELDS) {
    const err = validateDocumentField(field, draft[field]);
    if (err) errors[field] = err;
  }
  return errors;
}
