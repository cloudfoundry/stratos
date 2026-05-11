import { Injectable, OnDestroy, inject } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import {
  CONNECT_ENDPOINTS_SUCCESS,
  DISCONNECT_ENDPOINTS_SUCCESS,
  EndpointActionComplete,
} from '@stratosui/store';

import { KUBERNETES_ENDPOINT_TYPE } from '../../kubernetes/kubernetes-entity-factory';
import { KubeEndpointDataRegistry } from './kube-endpoint-data.registry';

// Bridge between the (still-existing in wave-2) ngrx endpoint
// connect/disconnect actions and the signal-native
// `KubeEndpointDataRegistry`.
//
// Lifecycle:
//   * CONNECT_ENDPOINTS_SUCCESS for a kubernetes endpoint  ->
//     `registry.getService(guid)` to warm the cached service so
//     the first navigation already has a fetch in flight.
//   * DISCONNECT_ENDPOINTS_SUCCESS for a kubernetes endpoint ->
//     `registry.unregister(guid)` so a future re-connect starts
//     fresh (no stale namespace/node lists from the prior session).
//
// Wave-3 deletes ngrx Actions; this whole file goes away when the
// connect/disconnect events become signal/router-native. Until then
// the bridge is the only consumer that reaches into `@ngrx/effects`
// from the kubernetes signal layer — the ngrx coupling is contained
// here, not threaded into the registry or per-domain services.
//
// Bootstrap: the service is provided in root and constructed on
// demand by `KubernetesPackageRoutingModule`'s providers list (see
// kube-package-routing.module.ts). That guarantees we subscribe
// once at app startup, before any kubernetes endpoint connect is
// dispatched.

@Injectable({ providedIn: 'root' })
export class KubeEndpointLifecycleService implements OnDestroy {
  private readonly actions$ = inject(Actions);
  private readonly registry = inject(KubeEndpointDataRegistry);

  private readonly subs = new Subscription();

  // Diagnostics counters — surfaced via `window.__stratosKubeDiag`
  // alongside the registry snapshot.
  private _connects = 0;
  private _disconnects = 0;

  constructor() {
    this.subs.add(
      this.actions$.pipe(
        ofType<EndpointActionComplete>(CONNECT_ENDPOINTS_SUCCESS),
        filter(action => action.endpointType === KUBERNETES_ENDPOINT_TYPE && !!action.guid),
      ).subscribe(action => {
        this._connects++;
        // Warm the service. We intentionally don't `release()` —
        // the registry's sticky-cache means the warmed instance
        // hangs around for the first page navigation.
        this.registry.getService(action.guid);
      })
    );

    this.subs.add(
      this.actions$.pipe(
        ofType<EndpointActionComplete>(DISCONNECT_ENDPOINTS_SUCCESS),
        filter(action => action.endpointType === KUBERNETES_ENDPOINT_TYPE && !!action.guid),
      ).subscribe(action => {
        this._disconnects++;
        this.registry.unregister(action.guid);
      })
    );

    if (typeof window !== 'undefined') {
      const diag = (window as unknown as { __stratosKubeDiag?: Record<string, unknown> }).__stratosKubeDiag;
      if (diag && typeof diag === 'object') {
        diag.lifecycle = {
          connects: () => this._connects,
          disconnects: () => this._disconnects,
        };
      }
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
