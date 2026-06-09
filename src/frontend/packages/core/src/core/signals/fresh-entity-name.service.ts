import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EndpointModel, endpointEntityType } from '@stratosui/store';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
  private http = inject(HttpClient);

  // Single-resource native endpoint path segment per CF favorite type. These
  // return the Stratos shape ({ guid, name }); used only by the on-demand
  // `fetchNameFor` fallback below.
  private static readonly CF_FETCH_SEGMENT: Record<string, string> = {
    [CF_APPLICATION]: 'apps',
    [CF_ORGANIZATION]: 'org',
    [CF_SPACE]: 'spaces',
  };

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
      // Intentionally non-reactive: a peek-miss reads no signal, so a caller's
      // computed/effect won't re-run purely because this endpoint's data later
      // arrives — it re-resolves on its own trigger (favorite identity / recents
      // state change). Do NOT read a signal here to "fix" that; it would couple
      // every card to the registry's internal map. This is the accepted
      // "refresh where endpoint data is loaded" boundary.
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

  /**
   * On-demand fallback for `freshNameFor`: when the entity is in no loaded
   * signal (e.g. the home card fetched only counts) AND the favorite carries no
   * stored name, fetch the single resource and return its name. Async, so the
   * caller backfills the favorite's metadata with the result — both showing the
   * real name now and healing a null-metadata favorite for good. Returns null
   * on any failure (deleted entity, disconnected endpoint, network error).
   */
  fetchNameFor(ref: EntityNameRef): Observable<string | null> {
    if (!ref) {
      return of(null);
    }
    if (ref.entityType === endpointEntityType) {
      return of(this.endpointsSignals.endpoints()[ref.endpointId]?.name ?? null);
    }
    if (ref.entityId == null) {
      return of(null);
    }
    const segment = FreshEntityNameService.CF_FETCH_SEGMENT[ref.entityType];
    if (!segment) {
      return of(null);
    }
    return this.http.get<{ name?: string }>(`/pp/v1/cf/${segment}/${ref.endpointId}/${ref.entityId}`).pipe(
      map(entity => entity?.name ?? null),
      catchError(() => of(null)),
    );
  }
}
