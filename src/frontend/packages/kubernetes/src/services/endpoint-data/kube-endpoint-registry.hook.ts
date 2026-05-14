import { Injectable, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { EndpointModel } from '@stratosui/store';

import { EndpointsService } from '../../../../core/src/core/endpoints.service';
import { KUBERNETES_ENDPOINT_TYPE } from '../../kubernetes/kubernetes-entity-factory';
import { KubeEndpointDataRegistry } from './kube-endpoint-data.registry';

// Signal/router-native lifecycle hook for the kubernetes endpoint
// registry. Replaces the wave-2 `KubeEndpointLifecycleService` which
// listened for `CONNECT_ENDPOINTS_SUCCESS` / `DISCONNECT_ENDPOINTS_SUCCESS`
// ngrx Actions.
//
// Source of truth: `EndpointsService.endpoints$` — the same selector
// the rest of the app reads. Whatever flips an endpoint's
// `connectionStatus` (action, effect, or future signal-native writer)
// shows up here on the next emission.
//
// Per emission we diff against the previously-seen set of *connected
// kubernetes endpoint GUIDs* and:
//
//   * Warm `registry.getService(guid)` for new connects (guids in
//     current set, not previous) so the first navigation already has
//     a cached service.
//   * Evict `registry.unregister(guid)` for departures (guids in
//     previous set, not current). A departure covers BOTH a status
//     flip to disconnected AND the endpoint being removed entirely.
//
// Diff key: `endpoint.cnsi_type === KUBERNETES_ENDPOINT_TYPE &&
// endpoint.connectionStatus === 'connected'`. Subscriber sees
// post-reducer state — same "after commit" timing as the original
// ngrx-action listener, so eviction still happens after the flip.
//
// Bootstrap: provided in root and eagerly constructed by
// `KubernetesSetupModule` so the subscription is live before the
// user navigates into any kubernetes page.

@Injectable({ providedIn: 'root' })
export class KubeEndpointRegistryHook implements OnDestroy {
  private readonly endpointsService = inject(EndpointsService);
  private readonly registry = inject(KubeEndpointDataRegistry);

  private readonly subs = new Subscription();
  private lastConnected: Set<string> = new Set();

  // Diagnostics counters — surfaced via `window.__stratosKubeDiag.lifecycle`
  // alongside the registry snapshot, preserving the field name from the
  // wave-2 bridge so existing diagnostics keep working.
  private _connects = 0;
  private _disconnects = 0;
  private _emissions = 0;

  constructor() {
    this.subs.add(
      this.endpointsService.endpoints$.subscribe(endpoints => {
        this._emissions++;
        const current = this.computeConnectedKubeGuids(endpoints);

        // New connects: in current, not in previous → warm.
        current.forEach(guid => {
          if (!this.lastConnected.has(guid)) {
            this._connects++;
            // Sticky warm — registry caches the instance.
            this.registry.getService(guid);
          }
        });

        // Departures: in previous, not in current → evict. Covers both
        // status flip to disconnected AND endpoint removal.
        this.lastConnected.forEach(guid => {
          if (!current.has(guid)) {
            this._disconnects++;
            this.registry.unregister(guid);
          }
        });

        this.lastConnected = current;
      })
    );

    if (typeof window !== 'undefined') {
      const diag = (window as unknown as { __stratosKubeDiag?: Record<string, unknown> }).__stratosKubeDiag;
      if (diag && typeof diag === 'object') {
        diag.lifecycle = {
          connects: () => this._connects,
          disconnects: () => this._disconnects,
          emissions: () => this._emissions,
        };
      }
    }
  }

  private computeConnectedKubeGuids(
    endpoints: { [guid: string]: EndpointModel } | null | undefined,
  ): Set<string> {
    const out = new Set<string>();
    if (!endpoints) {
      return out;
    }
    for (const guid of Object.keys(endpoints)) {
      const ep = endpoints[guid];
      if (
        ep &&
        ep.cnsi_type === KUBERNETES_ENDPOINT_TYPE &&
        ep.connectionStatus === 'connected' &&
        ep.guid
      ) {
        out.add(ep.guid);
      }
    }
    return out;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
