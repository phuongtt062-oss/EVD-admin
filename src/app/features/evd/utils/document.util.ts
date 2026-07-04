import type { DocumentFieldKey } from '../constants/document.constant';
import type { Document, DocumentCategory, DocumentStatus } from '../models/document.model';

type DocumentDraft = { [K in DocumentFieldKey]: string };

export function toDocumentPayload(draft: DocumentDraft): Pick<Document, DocumentFieldKey> {
  return {
    code: draft.code.trim(),
    title: draft.title.trim(),
    category: draft.category as DocumentCategory,
    status: draft.status as DocumentStatus,
  };
}
