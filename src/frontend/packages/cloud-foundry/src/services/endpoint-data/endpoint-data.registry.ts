import { inject, Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
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

  private readonly instances = new Map<string, RegistryEntry>();
  private readonly cardQueue$ = new Subject<EndpointDataService>();
  private queueSub: Subscription;
  private maxConcurrentCards = 2;

  constructor() {
    this.queueSub = this.cardQueue$.pipe(
      mergeMap(svc => svc.load(), this.maxConcurrentCards),
    ).subscribe();
  }

  // Must be called before the first acquire() — rebuilding the subscription
  // mid-flight orphans in-progress load() observables on the old subscription.
  configure(maxConcurrentCards: number): void {
    this.maxConcurrentCards = maxConcurrentCards;
    this.queueSub.unsubscribe();
    this.queueSub = this.cardQueue$.pipe(
      mergeMap(svc => svc.load(), this.maxConcurrentCards),
    ).subscribe();
  }

  acquire(guid: string): EndpointDataService {
    const existing = this.instances.get(guid);
    if (existing) {
      existing.refCount++;
      return existing.service;
    }
    // EndpointDataService is a plain class (not @Injectable) — DI bypassed by design.
    // If it gains injected deps, they must be added to this constructor call.
    const service = new EndpointDataService(this.http, this.shim, guid);
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
    this.cardQueue$.complete();
  }
}
