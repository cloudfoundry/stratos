import { Injectable, Signal, computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { EndpointsDataService } from '../../../../store/src/services/endpoints-data.service';
import { APIResource, EntityInfo } from '../../../../store/src/types/api.types';
import { EndpointModel, withConnectingOverlay } from '../../../../store/src/types/endpoint.types';

@Injectable({
  providedIn: 'root'
})
export class CloudFoundryService {
  // W36-B Wave 3: source endpoints from EndpointsDataService instead
  // of the legacy ngrx PaginationMonitor. The CF endpoint set was
  // never paginated server-side; the new service's endpointsList()
  // signal is the authoritative source.
  private endpointsData = inject(EndpointsDataService);

  // Signal form of the CF endpoint set. Callers that need to read a list at a
  // known point in time — rather than react to it — must use these: the
  // observables below are driven by toObservable(), which republishes on the
  // next effect flush, so reading one immediately after
  // EndpointsDataService.whenReady() still sees the pre-hydration value.
  readonly cfEndpoints: Signal<EndpointModel[]> = computed(() =>
    this.endpointsData.endpointsList().filter(e => e.cnsi_type === 'cf')
  );

  // Endpoints whose token can serve a request right now. Request fan-out (the
  // app/service walls, the "have a connected CF" gates) reads this. 'expired'
  // is excluded — a dead token 401s — and so is 'connecting': a token mid-
  // connect isn't usable yet. Only genuinely connected CFs qualify.
  readonly connectedCFEndpoints: Signal<EndpointModel[]> = computed(() =>
    this.cfEndpoints().filter(endpoint => endpoint.connectionStatus === 'connected')
  );

  // Endpoints that belong to the user and should appear in the /cloud-foundry
  // picker: a live connection, an expired one they never disconnected (still
  // theirs, needs reconnect), or one mid-connect (shows the transient state).
  // 'disconnected' is excluded — the user dropped it; reconnect from the
  // Endpoints page. Broader than connectedCFEndpoints, which is fan-out only.
  readonly availableCFEndpoints: Signal<EndpointModel[]> = computed(() =>
    this.cfEndpoints().filter(endpoint => {
      const status = withConnectingOverlay(
        endpoint.connectionStatus,
        this.endpointsData.isConnecting(endpoint.guid ?? ''),
      );
      return status === 'connected' || status === 'expired' || status === 'connecting';
    })
  );

  hasRegisteredCFEndpoints$: Observable<boolean>;
  hasConnectedCFEndpoints$: Observable<boolean>;
  connectedCFEndpoints$: Observable<EndpointModel[]>;
  cFEndpoints$: Observable<EndpointModel[]>;
  waitForAppEntity$!: Observable<EntityInfo<APIResource>>;

  constructor() {
    this.cFEndpoints$ = toObservable(this.cfEndpoints);
    this.connectedCFEndpoints$ = toObservable(this.connectedCFEndpoints);

    this.hasConnectedCFEndpoints$ = this.connectedCFEndpoints$.pipe(
      map(endpoints => !!endpoints.length)
    );

    this.hasRegisteredCFEndpoints$ = this.cFEndpoints$.pipe(
      map(endpoints => !!endpoints.length)
    );
  }
}

