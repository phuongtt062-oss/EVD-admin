import { Injectable, inject } from '@angular/core';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { readApiError } from '../../../core/utils/api-error.util';
import { IMPORT_PARSE_WEIGHT } from '../constants/import.constant';
import { BulkImportError, BulkImportResult, ImportProgress } from '../models/document.model';
import { DocumentApiService } from './document-api.service';
import type { ImportWorkerOutMessage } from '../workers/import.worker';

export type ImportOrchestratorEvent =
  | { kind: 'progress'; progress: ImportProgress }
  | { kind: 'result'; result: BulkImportResult };

function calcImportPercent(
  phase: ImportProgress['phase'],
  parsed: number,
  uploaded: number,
  total: number
): number {
  if (phase === 'done') return 100;
  if (!total) return 0;

  const done = phase === 'parsing' ? parsed : uploaded;
  const weight = phase === 'parsing' ? IMPORT_PARSE_WEIGHT : 100 - IMPORT_PARSE_WEIGHT;
  const base = phase === 'parsing' ? 0 : IMPORT_PARSE_WEIGHT;
  return Math.min(phase === 'parsing' ? IMPORT_PARSE_WEIGHT : 100, base + Math.round((done / total) * weight));
}

@Injectable({ providedIn: 'root' })
export class ImportOrchestratorService {
  private readonly api = inject(DocumentApiService);
  private worker: Worker | null = null;
  private cancel$ = new Subject<void>();

  run(file: File): Observable<ImportOrchestratorEvent> {
    return new Observable((subscriber) => {
      this.cancel$ = new Subject<void>();
      const worker = new Worker(new URL('../workers/import.worker', import.meta.url), { type: 'module' });
      this.worker = worker;

      let total = 0;
      let parsed = 0;
      let uploaded = 0;
      let success = 0;
      let failed = 0;
      let parsingDone = false;
      let processing = false;
      let cancelled = false;
      const allErrors: BulkImportError[] = [];
      const batchQueue: Record<string, string>[][] = [];

      const emitProgress = (phase: ImportProgress['phase'], message: string): void => {
        subscriber.next({
          kind: 'progress',
          progress: {
            phase,
            parsed,
            uploaded,
            total,
            success,
            failed,
            percent: calcImportPercent(phase, parsed, uploaded, total || parsed),
            message,
          },
        });
      };

      const finish = (): void => {
        emitProgress('done', 'Hoàn tất import');
        subscriber.next({
          kind: 'result',
          result: { total: total || parsed, success, failed, errors: allErrors },
        });
        subscriber.complete();
      };

      const processQueue = async (): Promise<void> => {
        if (processing || cancelled) return;
        processing = true;

        while (batchQueue.length > 0 && !cancelled) {
          const batch = batchQueue.shift()!;
          try {
            const result = await firstValueFrom(this.api.bulkImport(batch).pipe(takeUntil(this.cancel$)));
            success += result.success;
            failed += result.failed;
            allErrors.push(...result.errors);
            uploaded += batch.length;
            emitProgress('uploading', `Đã upload ${uploaded}/${total || parsed} dòng`);
          } catch (err) {
            subscriber.error(new Error(readApiError(err, 'Upload batch thất bại')));
            return;
          }
        }

        processing = false;
        if (parsingDone && !batchQueue.length && !cancelled) finish();
      };

      worker.onmessage = (event: MessageEvent<ImportWorkerOutMessage>): void => {
        const msg = event.data;
        if (msg.type === 'progress') {
          parsed = msg.parsed;
          if (msg.total) total = msg.total;
          emitProgress('parsing', `Đang phân tích... ${parsed} dòng`);
        } else if (msg.type === 'batch') {
          batchQueue.push(msg.rows);
          void processQueue();
        } else if (msg.type === 'complete') {
          total = msg.totalRows;
          parsingDone = true;
          emitProgress('uploading', `Phân tích xong ${total} dòng, đang upload...`);
          void processQueue();
        } else if (msg.type === 'error') {
          subscriber.error(new Error(msg.message));
        }
      };

      worker.onerror = () => subscriber.error(new Error('Worker xử lý file gặp lỗi'));
      worker.postMessage({ type: 'parse', file });

      return () => {
        cancelled = true;
        this.cancel$.next();
        this.cancel$.complete();
        worker.terminate();
        this.worker = null;
      };
    });
  }

  cancel(): void {
    this.cancel$.next();
    this.worker?.terminate();
    this.worker = null;
  }
}
