import { Injectable, Signal, computed, inject } from '@angular/core';
import {
  EndpointModel,
  EndpointsDataService,
  IRequestEntityTypeState,
  entityCatalog,
} from '@stratosui/store';

import { AuthSignalService } from './auth-signal.service';

/**
 * Signal-native projection of the endpoints slice + auth-derived persistence flag.
 *
 * Mirrors the legacy `core/endpoints.service.ts` observable API
 * (`endpoints$`, `haveRegistered$`, `haveConnected$`, `connectedEndpoints$`,
 * `disablePersistenceFeatures$`) as `Signal<...>` accessors.
 *
 * Wave 2 (W36-B): the endpoints map is now sourced from
 * {@link EndpointsDataService} rather than the legacy `endpointEntitiesSelector`.
 * The public `endpoints` signal still returns a `Record<guid, EndpointModel>`
 * to preserve the `Object.keys` / `Object.values` consumer surface; the shape
 * is computed once per change from the new service's `Map`.
 *
 * Defensive entity-catalog filtering matches the legacy service behaviour:
 * endpoints whose type is not yet registered are excluded from the
 * "connected" projections rather than throwing.
 */
@Injectable({ providedIn: 'root' })
export class EndpointsSignalService {
  private endpointsService = inject(EndpointsDataService);
  private auth = inject(AuthSignalService);

  /** Raw endpoint entities keyed by GUID. Empty object before the service hydrates. */
  readonly endpoints: Signal<IRequestEntityTypeState<EndpointModel>> = computed(() => {
    const map = this.endpointsService.endpoints();
    const out: IRequestEntityTypeState<EndpointModel> = {};
    map.forEach((endpoint, guid) => {
      out[guid] = endpoint;
    });
    return out;
  });

  /** True iff at least one endpoint has been registered. */
  readonly haveRegistered: Signal<boolean> = computed(
    () => Object.keys(this.endpoints()).length > 0
  );

  /** Endpoints currently connected (or unconnectable types treated as always-on). */
  readonly connectedEndpoints: Signal<EndpointModel[]> = computed(() =>
    Object.values(this.endpoints()).filter(endpoint => isConnected(endpoint))
  );

  /** True iff at least one endpoint is connected. */
  readonly haveConnected: Signal<boolean> = computed(
    () => this.connectedEndpoints().length > 0
  );

  /**
   * True iff the deployment was started with `disablePersistenceFeatures=true`
   * in plugin-config (favorites, dashboards, etc. are turned off).
   */
  readonly disablePersistenceFeatures: Signal<boolean> = computed(() => {
    const sessionData = this.auth.sessionData();
    return sessionData?.['plugin-config']?.disablePersistenceFeatures === 'true';
  });
}

function isConnected(endpoint: EndpointModel): boolean {
  if (!endpoint || !endpoint.cnsi_type) {
    return false;
  }
  try {
    const epType = entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type);
    if (!epType?.definition) {
      return false;
    }
    return (
      epType.definition.unConnectable ||
      endpoint.connectionStatus === 'connected' ||
      endpoint.connectionStatus === 'checking'
    );
  } catch {
    return false;
  }
}
