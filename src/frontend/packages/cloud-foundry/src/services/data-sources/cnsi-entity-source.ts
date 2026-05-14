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
  // Set true by preSeed() — short-circuits the next _doLoad() so the cached
  // bundle handed in by the registry-aware signal-config isn't immediately
  // wiped + re-fetched. The flag flips back to false after that one
  // short-circuit so refresh() (which re-enters _doLoad) still works.
  private _preseeded = false;

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
   * (e.g. the EndpointDataRegistry's pre-warmed services bundle). The next
   * call to load() will short-circuit, skipping the HTTP drain entirely;
   * subsequent refresh() / load()-after-refresh calls re-enter the normal
   * fetch path.
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
    this._preseeded = true;
  }

  private async _doLoad(): Promise<void> {
    // Short-circuit when preSeed() handed us a ready bundle. The seed
    // satisfies this load(); refresh() (or any subsequent load() after
    // refresh()) will fall through to the normal HTTP drain because the
    // flag flips off here.
    if (this._preseeded) {
      this._preseeded = false;
      return;
    }
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
        // sources are merged in MergeOrchestrator. Subclasses that need to
        // transform the wire shape provide adaptResource (services-domain
        // slice) — adapter does cnsiGuid stamping itself.
        const stamped = this.adaptResource
          ? (resp.resources as unknown[]).map(r => this.adaptResource!(r, this.cnsiGuid))
          : resp.resources.map(r => ({ ...r, cnsiGuid: this.cnsiGuid }) as unknown as T);
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
    const stamped = this.adaptResource
      ? this.adaptResource(item, this.cnsiGuid)
      : ({ ...item, cnsiGuid: this.cnsiGuid } as unknown as T);
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
