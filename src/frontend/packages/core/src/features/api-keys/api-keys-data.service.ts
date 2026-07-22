import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, Signal, WritableSignal, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiKey, BrowserStandardEncoder } from '@stratosui/store';

const apiKeysUrl = '/pp/v1/api_keys';

// Signal-native data service for the per-user API key collection.
// Owns the HTTP path to /pp/v1/api_keys directly — no ngrx pipeline,
// no entity-catalog, no PaginationMonitor. Consumers (the api-keys
// page, the add-key dialog, the per-row delete action) read `apiKeys`
// for rows and call load() / create() / remove() to mutate.
//
// Singleton (providedIn: 'root') so the page and the dialog share the
// same row collection — after the dialog returns a new key, the page's
// list updates synchronously without a round-trip.
@Injectable({ providedIn: 'root' })
export class ApiKeysDataService {
  private readonly http = inject(HttpClient);

  private readonly _apiKeys: WritableSignal<ApiKey[]> = signal([]);
  readonly apiKeys: Signal<ApiKey[]> = this._apiKeys.asReadonly();

  private readonly _isLoading: WritableSignal<boolean> = signal(false);
  readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();

  private readonly _error: WritableSignal<string | null> = signal(null);
  readonly error: Signal<string | null> = this._error.asReadonly();

  private readonly _lastFetched: WritableSignal<Date | null> = signal(null);
  readonly lastFetched: Signal<Date | null> = this._lastFetched.asReadonly();

  async load(): Promise<void> {
    if (this._lastFetched() !== null) return;
    await this.fetch();
  }

  async refresh(): Promise<void> {
    this._lastFetched.set(null);
    await this.fetch();
  }

  // Throws on HTTP failure so callers (dialog submit) can surface the
  // error message inline; on success the new key is appended to the
  // shared rows signal AND returned so the dialog can show the secret.
  async create(comment: string): Promise<ApiKey> {
    try {
      const body = new HttpParams({
        encoder: new BrowserStandardEncoder(),
        fromObject: { comment },
      });
      const created = await firstValueFrom(
        this.http.post<ApiKey>(apiKeysUrl, body),
      );
      this._apiKeys.update(curr => [...curr, created]);
      return created;
    } catch (err) {
      throw new Error(this.errorMessage(err));
    }
  }

  // Throws on HTTP failure. On success the row is removed from the
  // shared rows signal so the list cell re-renders without waiting on
  // a refresh.
  async remove(guid: string): Promise<void> {
    try {
      const params = new HttpParams({
        encoder: new BrowserStandardEncoder(),
        fromObject: { guid },
      });
      await firstValueFrom(this.http.delete(apiKeysUrl, { params }));
      this._apiKeys.update(curr => curr.filter(k => k.guid !== guid));
    } catch (err) {
      throw new Error(this.errorMessage(err));
    }
  }

  private async fetch(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const resp = await firstValueFrom(this.http.get<ApiKey[]>(apiKeysUrl));
      this._apiKeys.set(resp ?? []);
    } catch (err) {
      this._apiKeys.set([]);
      this._error.set(this.errorMessage(err));
    } finally {
      this._isLoading.set(false);
      this._lastFetched.set(new Date());
    }
  }

  private errorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      return typeof err.error === 'string' ? err.error : (err.message || 'API key request failed');
    }
    if (err instanceof Error) return err.message;
    return 'API key request failed';
  }
}
