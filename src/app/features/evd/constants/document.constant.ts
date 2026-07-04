import rules from '../../../../../shared/document-rules.json';
import { FILTER_ALL_LABEL } from '../../../core/constants/app.constant';
import type { DocumentCategory, DocumentStatus } from '../models/document.model';

export const DOCUMENT_FIELDS = ['code', 'title', 'category', 'status'] as const;
export type DocumentFieldKey = (typeof DOCUMENT_FIELDS)[number];

export const DOCUMENT_STATUSES = rules.statuses as DocumentStatus[];
export const DOCUMENT_CATEGORIES = rules.categories as DocumentCategory[];
export const DOCUMENT_VALIDATION = rules.validation;

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  DRAFT: 'Nháp',
  ACTIVE: 'Hoạt động',
  ARCHIVED: 'Lưu trữ',
};

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  CONTRACT: 'Hợp đồng',
  INVOICE: 'Hóa đơn',
  REPORT: 'Báo cáo',
};

export const CATEGORY_OPTIONS = DOCUMENT_CATEGORIES.map((value) => ({
  label: CATEGORY_LABELS[value],
  value,
}));

export const STATUS_OPTIONS = DOCUMENT_STATUSES.map((value) => ({
  label: STATUS_LABELS[value],
  value,
}));

export const CATEGORY_FILTER_OPTIONS = [
  { label: FILTER_ALL_LABEL, value: '' as DocumentCategory | '' },
  ...CATEGORY_OPTIONS,
];

export const STATUS_FILTER_OPTIONS = [
  { label: FILTER_ALL_LABEL, value: '' as DocumentStatus | '' },
  ...STATUS_OPTIONS,
];
