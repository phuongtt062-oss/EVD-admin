const path = require('path');
const jsonServer = require('json-server');
const { collectDocumentErrors } = require('../shared/document-validation');

const server = jsonServer.create();
const dbPath = path.join(__dirname, 'db.json');
const db = jsonServer.router(dbPath).db;
const middlewares = jsonServer.defaults();
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

server.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const allowAll = allowedOrigins.includes('*');
  const isAllowed = allowAll || (requestOrigin && allowedOrigins.includes(requestOrigin));

  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', allowAll ? '*' : requestOrigin);
  }

  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

server.get('/health', (req, res) => {
  res.json({ ok: true });
});

server.use(middlewares);
server.use(jsonServer.bodyParser);

function getUser(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;

  try {
    return JSON.parse(Buffer.from(auth.slice(7), 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const user = getUser(req);
  if (!user?.email) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  req.user = user;
  next();
}

function getDocuments() {
  return db.get('documents').value();
}

function hasDuplicateCode(docs, code, excludeId) {
  return docs.some((doc) => doc.code === code && doc.id !== excludeId);
}

function sendValidationError(res, errors) {
  return res.status(400).json({ message: 'Validation failed', errors });
}

function validateDocument(doc, docs, excludeId) {
  const errors = collectDocumentErrors(doc);
  if (errors.length) return errors;
  if (hasDuplicateCode(docs, doc.code, excludeId)) return ['code already exists'];
  return [];
}

function buildDocument(payload, user, existing) {
  if (existing) {
    return {
      ...existing,
      ...payload,
      id: existing.id,
      createdBy: existing.createdBy,
      createdDate: existing.createdDate,
      code: String(payload.code ?? existing.code).trim(),
      title: String(payload.title ?? existing.title).trim(),
    };
  }

  return {
    id: String(Date.now()),
    code: String(payload.code || '').trim(),
    title: String(payload.title || '').trim(),
    category: payload.category,
    status: payload.status,
    createdBy: user.email,
    createdDate: new Date().toISOString(),
  };
}

function buildImportDocument(row, user, index) {
  return {
    id: String(Date.now() + index),
    code: String(row.code ?? '').trim(),
    title: String(row.title ?? '').trim(),
    category: String(row.category ?? '').toUpperCase(),
    status: String(row.status ?? '').toUpperCase(),
    createdBy: user.email,
    createdDate: new Date().toISOString(),
  };
}

function filterDocuments(list, query, user) {
  let result = [...list];

  if (user.role === 'STAFF') {
    result = result.filter((doc) => doc.createdBy === user.email);
  }

  const search = String(query.search || '')
    .trim()
    .toLowerCase();
  if (search) {
    result = result.filter(
      (doc) => doc.code.toLowerCase().includes(search) || doc.title.toLowerCase().includes(search)
    );
  }
  if (query.status) result = result.filter((doc) => doc.status === query.status);
  if (query.category) result = result.filter((doc) => doc.category === query.category);

  result.sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  return result;
}

server.use('/documents', requireAuth);

server.get('/documents', (req, res) => {
  const list = filterDocuments(getDocuments(), req.query, req.user);
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.max(1, parseInt(req.query.pageSize, 10) || 10);
  const start = (page - 1) * pageSize;

  res.json({
    items: list.slice(start, start + pageSize),
    total: list.length,
    page,
    pageSize,
  });
});

server.post('/documents', (req, res) => {
  const docs = getDocuments();
  const doc = buildDocument(req.body || {}, req.user);
  const errors = validateDocument(doc, docs);

  if (errors.length) return sendValidationError(res, errors);

  db.get('documents').push(doc).write();
  res.status(201).json(doc);
});

server.put('/documents/:id', (req, res) => {
  const id = req.params.id;
  const docs = getDocuments();
  const existing = docs.find((doc) => doc.id === id);

  if (!existing) {
    return res.status(404).json({ message: 'Document not found' });
  }
  if (req.user.role === 'STAFF' && existing.createdBy !== req.user.email) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const updated = buildDocument(req.body || {}, req.user, existing);
  const errors = validateDocument(updated, docs, id);

  if (errors.length) return sendValidationError(res, errors);

  db.get('documents').find({ id }).assign(updated).write();
  res.json(updated);
});

server.delete('/documents/:id', (req, res) => {
  if (req.user.role === 'STAFF') {
    return res.status(403).json({ message: 'STAFF khong co quyen xoa tai lieu' });
  }

  const id = req.params.id;
  if (!getDocuments().some((doc) => doc.id === id)) {
    return res.status(404).json({ message: 'Document not found' });
  }

  db.get('documents').remove({ id }).write();
  res.status(204).send();
});

server.post('/documents/bulk-import', (req, res) => {
  const rows = req.body?.rows;
  if (!Array.isArray(rows)) {
    return res.status(400).json({ message: 'rows array is required' });
  }

  const collection = db.get('documents');
  const codes = new Set(collection.value().map((doc) => doc.code));
  const result = { total: rows.length, success: 0, failed: 0, errors: [] };
  const toInsert = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || {};
    const rowNum = Number(row._rowNum) || i + 2;
    const doc = buildImportDocument(row, req.user, i);
    const errors = collectDocumentErrors(doc);

    if (codes.has(doc.code)) errors.push('code already exists');
    if (errors.length) {
      result.failed++;
      result.errors.push({ row: rowNum, data: row, errors });
      continue;
    }

    toInsert.push(doc);
    codes.add(doc.code);
    result.success++;
  }

  if (toInsert.length) {
    db.set('documents', [...collection.value(), ...toInsert]).write();
  }

  res.json(result);
});

const PORT = process.env.PORT || 3000;
const httpServer = server.listen(PORT, () => {
  console.log(`JSON Server running at http://localhost:${PORT}`);
});

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} dang duoc su dung. Chay "npm run predev" hoac tat process khac.`);
    process.exit(1);
  }
  throw err;
});
