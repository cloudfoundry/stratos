import { Signal, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface StratosPagedResponseLike<T> {
  resources: T[];
  pagination: {
    totalResults: number;
    totalPages: number;
    next: { href: string } | null;
    previous: { href: string } | null;
    first: { href: string } | null;
    last: { href: string } | null;
  };
  _meta?: {
    unavailable?: string[];
    errors?: Array<{ scope: string; code: string; title: string; detail: string; affected?: string[] }>;
  };
}

export abstract class CnsiEntitySource<T> {
  protected abstract readonly entityName: string;

  protected readonly _items = signal<T[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<unknown | null>(null);
  private readonly _done = signal(false);
  private readonly _fetchedPages = signal(0);
  private readonly _totalResults = signal(0);

  readonly items: Signal<T[]> = this._items.asReadonly();
  readonly loading: Signal<boolean> = this._loading.asReadonly();
  readonly error: Signal<unknown | null> = this._error.asReadonly();
  readonly done: Signal<boolean> = this._done.asReadonly();
  readonly fetchedPages: Signal<number> = this._fetchedPages.asReadonly();
  readonly totalResults: Signal<number> = this._totalResults.asReadonly();

  private _inFlight: Promise<void> | null = null;
  private _inFlightOne: Map<string, Promise<void>> = new Map();

  constructor(
    readonly cnsiGuid: string,
    protected readonly http: HttpClient,
    protected readonly pageSize: number = 100,
  ) {}

  protected urlFor(page: number): string {
    return `/pp/v1/cf/${this.entityName}/${this.cnsiGuid}?return=summary&per_page=${this.pageSize}&page=${page}`;
  }

  protected urlForOne?(guid: string): string;

  async load(): Promise<void> {
    if (this._inFlight) return this._inFlight;
    this._inFlight = this._doLoad();
    try {
      await this._inFlight;
    } finally {
      this._inFlight = null;
    }
  }

  private async _doLoad(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._items.set([]);
    this._fetchedPages.set(0);
    this._done.set(false);

    try {
      let page = 1;
      while (!this._done()) {
        const resp = await firstValueFrom(this.http.get<StratosPagedResponseLike<T>>(this.urlFor(page)));
        // Stamp cnsiGuid on each resource — the backend's Stratos-shape DTOs
        // don't carry it (the source route already identifies the endpoint),
        // but downstream filters/joins need it once items from multiple
        // sources are merged in MergeOrchestrator.
        const stamped = resp.resources.map(r => ({ ...r, cnsiGuid: this.cnsiGuid }) as unknown as T);
        this._items.update(curr => curr.concat(stamped));
        this._totalResults.set(resp.pagination.totalResults);
        this._fetchedPages.set(page);
        if (resp.pagination.next == null) {
          this._done.set(true);
        } else {
          page += 1;
        }
      }
    } catch (err) {
      this._error.set(err);
    } finally {
      this._loading.set(false);
    }
  }

  async refresh(): Promise<void> {
    await this.load();
  }

  byGuid(guid: string): Signal<T | undefined> {
    return computed(() => this._items().find(i => (i as { guid?: string }).guid === guid));
  }

  async loadOne(guid: string): Promise<void> {
    if (this._items().some(i => (i as { guid?: string }).guid === guid)) return;
    if (this._inFlight) {
      await this._inFlight;
      return;
    }
    const existing = this._inFlightOne.get(guid);
    if (existing) return existing;
    const p = this._doLoadOne(guid).finally(() => this._inFlightOne.delete(guid));
    this._inFlightOne.set(guid, p);
    return p;
  }

  protected async _doLoadOne(guid: string): Promise<void> {
    if (!this.urlForOne) {
      await this.load();
      return;
    }
    const url = this.urlForOne(guid);
    const item = await firstValueFrom(this.http.get<T>(url));
    const stamped = { ...item, cnsiGuid: this.cnsiGuid } as unknown as T;
    this._items.update(curr => {
      const idx = curr.findIndex(i => (i as { guid?: string }).guid === guid);
      if (idx >= 0) {
        const next = [...curr];
        next[idx] = stamped;
        return next;
      }
      return [...curr, stamped];
    });
  }

  protected patchItems(fn: (items: T[]) => T[]): void {
    this._items.update(fn);
  }
}
