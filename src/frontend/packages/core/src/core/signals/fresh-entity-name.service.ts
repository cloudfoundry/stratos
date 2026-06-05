import { Injectable, inject } from '@angular/core';
import { EndpointModel, endpointEntityType } from '@stratosui/store';

import { EndpointDataRegistry } from '../../../../cloud-foundry/src/services/endpoint-data/endpoint-data.registry';
import { EndpointsSignalService } from './endpoints-signal.service';

// CF entity-type keys. Inlined as string literals (NOT imported from the
// cloud-foundry package) to keep this the only spot that reaches into CF, and
// to avoid widening the static type-dependency surface. These are stable wire
// keys (see cloud-foundry/src/cf-entity-types.ts).
const CF_APPLICATION = 'application';
const CF_ORGANIZATION = 'organization';
const CF_SPACE = 'space';

/** The (endpoint, type, id) coordinates a favorite or recent carries. */
export interface EntityNameRef {
  endpointType: string;
  entityType: string;
  endpointId: string;
  entityId?: string | null;
}

/**
 * Signal-native replacement for the deleted ngrx `requestData` name-sync: given
 * a favorited/recent entity's coordinates, return its freshly-fetched display
 * name, or null when no fresh data is available (source not loaded, entity
 * deleted, or endpoint disconnected).
 *
 * Reads signals only — call it inside a `computed()`/`effect()` to get
 * reactivity. This is the single (precedented) core->cloud-foundry reader; it
 * uses `EndpointDataRegistry.peek()` so it never creates or triggers a load.
 */
@Injectable({ providedIn: 'root' })
export class FreshEntityNameService {
  private registry = inject(EndpointDataRegistry);
  private endpointsSignals = inject(EndpointsSignalService);

  freshNameFor(ref: EntityNameRef): string | null {
    if (!ref) {
      return null;
    }
    // Endpoint favorites (any endpointType) resolve from the endpoints signal;
    // app/org/space (CF-only entity-type keys) resolve from the CF registry.
    if (ref.entityType === endpointEntityType) {
      const endpoint: EndpointModel | undefined = this.endpointsSignals.endpoints()[ref.endpointId];
      return endpoint?.name ?? null;
    }
    const svc = this.registry.peek(ref.endpointId);
    if (!svc) {
      return null;
    }
    const list =
      ref.entityType === CF_APPLICATION ? svc.apps() :
      ref.entityType === CF_ORGANIZATION ? svc.orgs() :
      ref.entityType === CF_SPACE ? svc.spaces() :
      null;
    if (!list) {
      return null;
    }
    // Non-endpoint favorites always carry an entity guid; a null id can never
    // match a real entity, so bail explicitly rather than scanning the list.
    if (ref.entityId == null) {
      return null;
    }
    const match = list.find(entity => entity.guid === ref.entityId);
    return match?.name ?? null;
  }
}
