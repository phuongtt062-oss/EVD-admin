/// <reference lib="webworker" />

import * as XLSX from 'xlsx';

import {
  IMPORT_BATCH_SIZE,
  IMPORT_HEADERS,
  IMPORT_PROGRESS_INTERVAL,
} from '../constants/import.constant';

export type ImportWorkerInMessage = {
  type: 'parse';
  file: File;
};

export type ImportWorkerOutMessage =
  | { type: 'progress'; parsed: number; total?: number }
  | { type: 'batch'; rows: Record<string, string>[] }
  | { type: 'complete'; totalRows: number }
  | { type: 'error'; message: string };

function post(message: ImportWorkerOutMessage): void {
  self.postMessage(message);
}

function normalizeHeader(key: string): string {
  return key.replace(/^\uFEFF/, '').toLowerCase().replace(/\s+/g, '');
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function buildRow(cols: string[], headerIndex: Record<string, number>, rowNum: number): Record<string, string> {
  const row: Record<string, string> = { _rowNum: String(rowNum) };
  for (const header of IMPORT_HEADERS) {
    row[header] = cols[headerIndex[header]] ?? '';
  }
  return row;
}

function validateHeaders(headers: string[]): Record<string, number> | null {
  const normalized = headers.map(normalizeHeader);
  const missing = IMPORT_HEADERS.filter((header) => !normalized.includes(header));
  if (missing.length) {
    post({ type: 'error', message: `Thiếu cột bắt buộc: ${missing.join(', ')}` });
    return null;
  }

  const headerIndex: Record<string, number> = {};
  normalized.forEach((header, index) => {
    headerIndex[header] = index;
  });
  return headerIndex;
}

function flushBatch(batch: Record<string, string>[]): Record<string, string>[] {
  if (!batch.length) return batch;
  post({ type: 'batch', rows: batch });
  return [];
}

async function parseCsvStream(file: File): Promise<void> {
  const reader = file.stream().pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  let headerIndex: Record<string, number> | null = null;
  let parsed = 0;
  let batch: Record<string, string>[] = [];
  let lineNumber = 1;

  while (true) {
    const { done, value } = await reader.read();
    if (done && !buffer) break;

    if (value) buffer += value;

    const lines = buffer.split(/\r?\n/);
    buffer = done ? '' : (lines.pop() ?? '');

    for (const line of lines) {
      if (!line.trim()) {
        lineNumber++;
        continue;
      }

      const cols = parseCsvLine(line);

      if (!headerIndex) {
        headerIndex = validateHeaders(cols);
        if (!headerIndex) return;
        lineNumber++;
        continue;
      }

      batch.push(buildRow(cols, headerIndex, lineNumber));
      parsed++;
      lineNumber++;

      if (parsed % IMPORT_PROGRESS_INTERVAL === 0) {
        post({ type: 'progress', parsed });
      }

      if (batch.length >= IMPORT_BATCH_SIZE) {
        batch = flushBatch(batch);
      }
    }

    if (done) break;
  }

  if (buffer.trim()) {
    if (!headerIndex) {
      headerIndex = validateHeaders(parseCsvLine(buffer));
      if (!headerIndex) return;
    } else {
      batch.push(buildRow(parseCsvLine(buffer), headerIndex, lineNumber));
      parsed++;
    }
  }

  flushBatch(batch);
  post({ type: 'progress', parsed, total: parsed });
  post({ type: 'complete', totalRows: parsed });
}

function normalizeExcelRow(raw: Record<string, unknown>, rowNum: number): Record<string, string> {
  const normalized: Record<string, string> = { _rowNum: String(rowNum) };
  for (const header of IMPORT_HEADERS) {
    normalized[header] = '';
  }

  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith('__EMPTY')) continue;
    const header = normalizeHeader(key);
    if ((IMPORT_HEADERS as readonly string[]).includes(header)) {
      normalized[header] = String(value ?? '').trim();
    }
  }

  return normalized;
}

async function parseExcelFile(file: File): Promise<void> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    post({ type: 'error', message: 'File Excel không có sheet nào' });
    return;
  }

  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  if (!json.length) {
    post({ type: 'error', message: 'File Excel phải có header và ít nhất 1 dòng dữ liệu' });
    return;
  }

  const headers = Object.keys(json[0] ?? {}).map(normalizeHeader);
  const missing = IMPORT_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length) {
    post({ type: 'error', message: `Thiếu cột bắt buộc: ${missing.join(', ')}` });
    return;
  }

  const total = json.length;
  post({ type: 'progress', parsed: 0, total });

  let batch: Record<string, string>[] = [];
  for (let i = 0; i < json.length; i++) {
    batch.push(normalizeExcelRow(json[i], i + 2));

    if ((i + 1) % IMPORT_PROGRESS_INTERVAL === 0 || i + 1 === total) {
      post({ type: 'progress', parsed: i + 1, total });
    }

    if (batch.length >= IMPORT_BATCH_SIZE) {
      batch = flushBatch(batch);
    }
  }

  flushBatch(batch);
  post({ type: 'complete', totalRows: total });
}

function getFileKind(file: File): 'csv' | 'excel' | 'unsupported' {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'csv') return 'csv';
  if (ext === 'xlsx' || ext === 'xls') return 'excel';

  const mime = file.type.toLowerCase();
  if (mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'excel';
  if (mime === 'text/csv' || mime === 'text/plain') return 'csv';

  return 'unsupported';
}

async function parseFile(file: File): Promise<void> {
  const kind = getFileKind(file);
  if (kind === 'csv') return parseCsvStream(file);
  if (kind === 'excel') return parseExcelFile(file);
  post({ type: 'error', message: 'Chỉ hỗ trợ file CSV hoặc Excel (.xlsx, .xls)' });
}

self.onmessage = (event: MessageEvent<ImportWorkerInMessage>) => {
  if (event.data.type !== 'parse') return;

  parseFile(event.data.file).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : 'Không đọc được file';
    post({ type: 'error', message });
  });
};
