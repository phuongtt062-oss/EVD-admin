import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

type HttpQuery = Record<string, string | number | boolean>;

@Injectable({ providedIn: 'root' })
export class BaseApiService {
  private readonly http = inject(HttpClient);
  protected readonly apiBaseUrl = environment.apiUrl;

  get<T>(path: string, query?: object): Observable<T> {
    return this.http.get<T>(`${this.apiBaseUrl}${path}`, { params: query as HttpQuery });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.apiBaseUrl}${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.apiBaseUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.apiBaseUrl}${path}`);
  }
}
