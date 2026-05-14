import { inject, Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Subject, Subscription } from 'rxjs';
import { mergeMap, concatMap, tap } from 'rxjs/operators';
import { StratosDiagnostics } from '../diagnostics/stratos-diagnostics.service';
import { CnsiUsersSnapshotService } from './cnsi-users-snapshot.service';
import { EndpointDataService } from './endpoint-data.service';
import { EndpointDataShim } from './endpoint-data.shim';

interface RegistryEntry {
  service: EndpointDataService;
  refCount: number;
}

@Injectable({ providedIn: 'root' })
export class EndpointDataRegistry implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly shim = inject(EndpointDataShim);
  private readonly diagnostics = inject(StratosDiagnostics);
  private readonly cnsiUsers = inject(CnsiUsersSnapshotService);

  private readonly instances = new Map<string, RegistryEntry>();
  private readonly cardQueue$ = new Subject<EndpointDataService>();
  private readonly detailsQueue$ = new Subject<EndpointDataService>();
  // Pre-warm queue for the secondary domains the operator typically reaches
  // for after the home dashboard: services (Marketplace + Services pages)
  // and users (Summary tile + Users tab). Both fire AFTER loadDetails so the
  // primary apps/orgs/spaces signals warm first; the user-perceptible
  // dashboard render isn't penalized. Pre-warming keeps the user on the
  // home page long enough that subsequent navigation finds a hot cache.
  private readonly prewarmQueue$ = new Subject<EndpointDataService>();
  private queueSub: Subscription;
  private detailsSub: Subscription;
  private prewarmSub: Subscription;
  // Must match the backend default in src/jetstream/info.go (s.Configuration.
  // EndpointCardConcurrency defaults to 2). If these drift, the first call to
  // configure() from auth.sessionData.config rebuilds the card queue and
  // cancels any in-flight load()s — the race that leaves slow CFs at 0 counts.
  private maxConcurrentCards = 2;

  private _acquireCalls = 0;
  private _enqueues = 0;
  private _acquireExistingHits = 0;
  private _configureCalls = 0;

  constructor() {
    this.queueSub = this.buildCardQueue();
    // Details fetches run one-at-a-time after their card's load() completes.
    // Serial (concatMap) so the big full-list requests don't pile up and drown
    // out other card fast-path traffic. On completion, enqueue the secondary
    // pre-warm pass for services + users so Marketplace/Services/Users tabs
    // find a hot cache when the operator navigates off the home page.
    this.detailsSub = this.detailsQueue$.pipe(
      concatMap(svc => svc.loadDetails().pipe(
        tap({ complete: () => this.prewarmQueue$.next(svc) }),
      )),
    ).subscribe();
    // Secondary pre-warm: services-domain details (instances + offerings +
    // plans + brokers) followed by a lazy users-snapshot read. Serial across
    // CFs to avoid stacking 4×N parallel CAPI hits on a multi-endpoint
    // foundation. Users snapshot kick is fire-and-forget — the service's
    // first-read sentinel triggers the /pp/v1/cf/users/:cnsi fetch
    // internally and we don't need to await it.
    this.prewarmSub = this.prewarmQueue$.pipe(
      concatMap(svc => from(svc.loadServicesDetails()).pipe(
        tap({ complete: () => { this.cnsiUsers.users(svc.guid); } }),
      )),
    ).subscribe();

    if (typeof window !== 'undefined') {
      (window as any).__stratosDiag = {
        snapshot: () => this.getSnapshot(),
        registry: this,
      };
    }
  }

  getSnapshot() {
    return {
      maxConcurrentCards: this.maxConcurrentCards,
      acquireCalls: this._acquireCalls,
      enqueues: this._enqueues,
      acquireExistingHits: this._acquireExistingHits,
      configureCalls: this._configureCalls,
      instances: Array.from(this.instances.entries()).map(([guid, entry]) => ({
        guid,
        refCount: entry.refCount,
        lastFetched: entry.service.lastFetched()?.toISOString() ?? null,
        appCount: entry.service.appCount(),
        orgCount: entry.service.orgCount(),
        routeCount: entry.service.routeCount(),
      })),
    };
  }

  // Rebuilding the subscription mid-flight orphans in-progress load()
  // observables on the old subscription — cancelling their HTTP merges and
  // leaving the corresponding endpoint card with 0 counts.
  //
  // Safety guard: when the backend config matches the current value we
  // skip the rebuild entirely. This is the common case (backend default
  // matches our default of 3), and it avoids the classic race where
  // ngAfterViewInit enqueues cards BEFORE the auth.sessionData.config
  // selector emits — which on a hard refresh (store rehydrating) happens
  // reliably and kills the slowest card's load (the CF with the most
  // orgs).
  configure(maxConcurrentCards: number): void {
    this._configureCalls++;
    if (this.maxConcurrentCards === maxConcurrentCards) return;
    this.maxConcurrentCards = maxConcurrentCards;
    this.queueSub.unsubscribe();
    this.queueSub = this.buildCardQueue();
  }

  acquire(guid: string): EndpointDataService {
    this._acquireCalls++;
    const existing = this.instances.get(guid);
    if (existing) {
      this._acquireExistingHits++;
      existing.refCount++;
      return existing.service;
    }
    // EndpointDataService is a plain class (not @Injectable) — DI bypassed by design.
    // If it gains injected deps, they must be added to this constructor call.
    const service = new EndpointDataService(this.http, this.shim, guid, this.diagnostics);
    this.instances.set(guid, { service, refCount: 1 });
    this._enqueues++;
    this.cardQueue$.next(service);
    return service;
  }

  release(guid: string): void {
    const entry = this.instances.get(guid);
    if (!entry) { return; }
    entry.refCount = Math.max(0, entry.refCount - 1);
    // Instance stays in map with its data (sticky) — only removed on explicit evict
  }

  ngOnDestroy(): void {
    this.queueSub.unsubscribe();
    this.detailsSub.unsubscribe();
    this.prewarmSub.unsubscribe();
    this.cardQueue$.complete();
    this.detailsQueue$.complete();
    this.prewarmQueue$.complete();
  }

  private buildCardQueue(): Subscription {
    return this.cardQueue$.pipe(
      // Run card fast-path loads with bounded concurrency. Chain into the
      // details queue so each endpoint's full-data fetch happens after its
      // counts land.
      mergeMap(svc => svc.load().pipe(
        // load() uses merge() over 3 HTTP calls and emits once per inner
        // completion, so we can't tap on next() — that would enqueue details
        // 3 times per card. Fire on complete() only.
        tap({ complete: () => this.detailsQueue$.next(svc) }),
      ), this.maxConcurrentCards),
    ).subscribe();
  }
}
