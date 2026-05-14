import { Injectable, Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import {
  EndpointModel,
  EndpointOnlyAppState,
  IRequestEntityTypeState,
  endpointEntitiesSelector,
  entityCatalog,
} from '@stratosui/store';

import { AuthSignalService } from './auth-signal.service';

const EMPTY_ENDPOINTS: IRequestEntityTypeState<EndpointModel> = {} as IRequestEntityTypeState<EndpointModel>;

/**
 * Signal-native projection of the endpoints slice + auth-derived persistence flag.
 *
 * Mirrors the legacy `core/endpoints.service.ts` observable API
 * (`endpoints$`, `haveRegistered$`, `haveConnected$`, `connectedEndpoints$`,
 * `disablePersistenceFeatures$`) as `Signal<...>` accessors.
 *
 * Defensive entity-catalog filtering matches the legacy service behaviour:
 * endpoints whose type is not yet registered are excluded from the
 * "connected" projections rather than throwing.
 */
@Injectable({ providedIn: 'root' })
export class EndpointsSignalService {
  private store = inject<Store<EndpointOnlyAppState>>(Store);
  private auth = inject(AuthSignalService);

  /** Raw endpoint entities keyed by GUID. Empty object before the store hydrates. */
  readonly endpoints: Signal<IRequestEntityTypeState<EndpointModel>> = toSignal(
    this.store.select(endpointEntitiesSelector),
    { initialValue: EMPTY_ENDPOINTS }
  );

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
  if (!endpoint) {
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
