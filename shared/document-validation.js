const rules = require('./document-rules.json');

const DOCUMENT_FIELDS = rules.fields;
const DOCUMENT_CATEGORIES = rules.categories;
const DOCUMENT_STATUSES = rules.statuses;
const DOCUMENT_VALIDATION = rules.validation;

function validateDocumentField(field, value) {
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
      return DOCUMENT_CATEGORIES.includes(value) ? null : 'Danh mục không hợp lệ';
    case 'status':
      return DOCUMENT_STATUSES.includes(value) ? null : 'Trạng thái không hợp lệ';
    default:
      return null;
  }
}

function collectDocumentErrors(doc) {
  const errors = [];
  for (const field of DOCUMENT_FIELDS) {
    const err = validateDocumentField(field, doc[field]);
    if (err) errors.push(err);
  }
  if (!doc.createdBy?.trim()) errors.push('createdBy is required');
  return errors;
}

module.exports = { collectDocumentErrors };
