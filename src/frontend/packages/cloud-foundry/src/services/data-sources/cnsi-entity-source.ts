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

  // Page ceiling for the drain. Undefined (the default) drains every
  // page — right for catalog-sized collections (orgs, spaces, apps)
  // whose full set the UI genuinely needs. Subclasses over unbounded
  // historical collections (audit events) set this to keep browser
  // memory bounded; the handler must order newest-first so the kept
  // window is the recent one, not the oldest.
  protected readonly maxPages?: number;

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

  /**
   * Optional wire-boundary adapter. When present, applied to each raw
   * resource fetched from the handler before the cnsiGuid stamp. Used by
   * subclasses whose handler still emits a legacy flat shape that needs
   * transformation to the new nested-ref T (services-domain slice).
   * Subclasses leave this undefined when the handler natively returns T.
   */
  protected adaptResource?(raw: unknown, cnsiGuid: string): T;

  async load(): Promise<void> {
    if (this._inFlight) return this._inFlight;
    this._inFlight = this._doLoad();
    try {
      await this._inFlight;
    } finally {
      this._inFlight = null;
    }
  }

  /**
   * Pre-seed local state from a cache the consumer has already populated
   * (e.g. the EndpointDataRegistry's pre-warmed services bundle). The seed
   * is paint-only: it makes the cached rows visible immediately, but the
   * next load() still revalidates against the backend (stale-while-
   * revalidate) — a seeded list that skipped its fetch was how out-of-band
   * changes stayed invisible until a hard refresh (#5766, #5767).
   *
   * Idempotent — calling preSeed() twice replaces the prior seed. Marks
   * the source as done so consumers querying done()/totalResults see the
   * same shape they'd see after a normal load.
   */
  preSeed(items: T[]): void {
    this._items.set(items);
    this._totalResults.set(items.length);
    this._fetchedPages.set(1);
    this._done.set(true);
  }

  /**
   * Report loading while a subclass satisfies load() from somewhere other
   * than _doLoad() — joining an endpoint-level drain, say. Without this the
   * source stays loading() === false for the whole join and consumers show
   * an empty list instead of a spinner.
   */
  protected setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  private async _doLoad(): Promise<void> {
    // Warm = rows already visible (a preSeed() or an earlier drain). The
    // drain still runs, but silently: no spinner, no wipe — pages collect
    // into a buffer and swap in atomically at the end, so the user never
    // sees the list flash empty and a failed revalidate keeps the old rows.
    // Cold keeps the original behavior: spinner + progressive per-page
    // rendering, which matters on many-page foundations.
    const warm = this._items().length > 0;
    const buffer: T[] = [];
    const append = warm
      ? (rows: T[]) => { buffer.push(...rows); }
      : (rows: T[]) => this._items.update(curr => curr.concat(rows));

    if (!warm) {
      this._loading.set(true);
      this._items.set([]);
      this._fetchedPages.set(0);
      this._done.set(false);
    }
    this._error.set(null);

    try {
      // Backend native handlers now echo cnsiGuid on every St* row, so the
      // ad-hoc stamping (`{...r, cnsiGuid: this.cnsiGuid}`) that lived here
      // is gone — replacing the V2-era "frontend stitches identifier back
      // in" pattern. adaptResource still runs for subclasses that need to
      // transform the wire shape (services-domain slice's nested-ref
      // rewrite); those adapters already preserve cnsiGuid from the wire.
      const stamp = (resources: T[]): T[] => this.adaptResource
        ? (resources as unknown[]).map(r => this.adaptResource!(r, this.cnsiGuid))
        : resources;

      // Swap the buffered drain in atomically (warm path); cold pages are
      // already in _items, so only the bookkeeping signals need setting.
      const commit = (totalResults: number, lastPage: number): void => {
        if (warm) this._items.set(buffer);
        this._totalResults.set(totalResults);
        this._fetchedPages.set(lastPage);
        this._done.set(true);
      };

      // Page 1 sequentially — its pagination block tells us totalPages.
      const first = await firstValueFrom(this.http.get<StratosPagedResponseLike<T>>(this.urlFor(1)));
      append(stamp(first.resources));
      if (!warm) {
        this._totalResults.set(first.pagination.totalResults);
        this._fetchedPages.set(1);
      }

      const totalPages = first.pagination.totalPages ?? 1;
      // done means "loaded everything this source intends to load" —
      // for a capped source that's the newest maxPages-window, not the
      // foundation's full history (totalResults still reports the real
      // total for consumers that want to surface the difference).
      const lastPage = this.maxPages ? Math.min(totalPages, this.maxPages) : totalPages;
      if (lastPage <= 1 || first.pagination.next == null) {
        commit(first.pagination.totalResults, 1);
        return;
      }

      // Pages 2..N in parallel with a small concurrency cap. Sequential
      // draining was the cause of the app-wall "details trickle in for a
      // long time" feedback on adepttech dev.84 — N sequential round-trips
      // for an N-page result, even when CAPI could serve them concurrently.
      // Matches the orgs/spaces drain pattern shipped in PR #5338.
      const remainingPages = Array.from({ length: lastPage - 1 }, (_, i) => i + 2);
      const concurrency = 4;
      let cursor = 0;
      let pageFetchErr: unknown = null;
      const worker = async () => {
        while (true) {
          if (pageFetchErr != null) return;
          const idx = cursor++;
          if (idx >= remainingPages.length) return;
          const page = remainingPages[idx];
          try {
            const resp = await firstValueFrom(this.http.get<StratosPagedResponseLike<T>>(this.urlFor(page)));
            append(stamp(resp.resources));
            if (!warm) this._fetchedPages.update(p => Math.max(p, page));
          } catch (err) {
            pageFetchErr = err;
            return;
          }
        }
      };
      const workers = Array.from({ length: Math.min(concurrency, remainingPages.length) }, () => worker());
      await Promise.all(workers);
      if (pageFetchErr != null) throw pageFetchErr;
      commit(first.pagination.totalResults, lastPage);
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
    // Backend echoes cnsiGuid (see _doLoad note); single-resource
    // adaptResource still runs for the services-domain rewrite.
    const stamped = this.adaptResource
      ? this.adaptResource(item, this.cnsiGuid)
      : item;
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

  /**
   * Drop a single item by guid from local state, no HTTP. Idempotent —
   * removing an already-absent item is a no-op. Decrements totalResults
   * to keep paging counts consistent with the items array. Use when a
   * write path (e.g. delete) has succeeded server-side and the consumer
   * wants to reflect the removal without re-fetching.
   */
  removeItem(guid: string): void {
    let removed = false;
    this._items.update(curr => {
      const idx = curr.findIndex(i => (i as { guid?: string }).guid === guid);
      if (idx < 0) return curr;
      removed = true;
      const next = [...curr];
      next.splice(idx, 1);
      return next;
    });
    if (removed) {
      this._totalResults.update(n => Math.max(0, n - 1));
    }
  }
}
