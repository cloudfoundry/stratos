import { inject, Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { mergeMap, concatMap, tap } from 'rxjs/operators';
import { StratosDiagnostics } from '../diagnostics/stratos-diagnostics.service';
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

  private readonly instances = new Map<string, RegistryEntry>();
  private readonly cardQueue$ = new Subject<EndpointDataService>();
  private readonly detailsQueue$ = new Subject<EndpointDataService>();
  private queueSub: Subscription;
  private detailsSub: Subscription;
  private maxConcurrentCards = 3;

  constructor() {
    this.queueSub = this.buildCardQueue();
    // Details fetches run one-at-a-time after their card's load() completes.
    // Serial (concatMap) so the big full-list requests don't pile up and drown
    // out other card fast-path traffic.
    this.detailsSub = this.detailsQueue$.pipe(
      concatMap(svc => svc.loadDetails()),
    ).subscribe();
  }

  // Must be called before the first acquire() — rebuilding the subscription
  // mid-flight orphans in-progress load() observables on the old subscription.
  configure(maxConcurrentCards: number): void {
    this.maxConcurrentCards = maxConcurrentCards;
    this.queueSub.unsubscribe();
    this.queueSub = this.buildCardQueue();
  }

  acquire(guid: string): EndpointDataService {
    const existing = this.instances.get(guid);
    if (existing) {
      existing.refCount++;
      return existing.service;
    }
    // EndpointDataService is a plain class (not @Injectable) — DI bypassed by design.
    // If it gains injected deps, they must be added to this constructor call.
    const service = new EndpointDataService(this.http, this.shim, guid, this.diagnostics);
    this.instances.set(guid, { service, refCount: 1 });
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
    this.cardQueue$.complete();
    this.detailsQueue$.complete();
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
