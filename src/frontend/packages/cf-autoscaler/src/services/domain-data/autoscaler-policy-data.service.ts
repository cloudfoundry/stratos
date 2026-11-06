import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '@stratosui/core';

import {
  autoscalerTransformArrayToMap,
  autoscalerTransformMapToArray,
} from '../../core/autoscaler-helpers/autoscaler-transform-policy';
import { AppAutoscalerPolicy, AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';

interface PolicyState {
  policy: AppAutoscalerPolicyLocal | null;
  loading: boolean;
  error: string | null;
  // 404 from GET (or post-DELETE state) is "no policy configured"; not an
  // error. The legacy effect distinguished `noPolicy` for the same reason.
  noPolicy: boolean;
  // Surface for the in-flight DELETE (detach) request. The legacy effect
  // path used the ngrx ActionState/`selectDeletionInfo` selector chain to
  // drive the autoscaler-tab snackbar after a "Disable Autoscaler"
  // confirmation; consumers now bind to `deleting()` / `deletionError()`
  // for the same UX feedback loop without going through the store.
  deleting: boolean;
  deletionError: string | null;
}

const EMPTY: PolicyState = {
  policy: null,
  loading: false,
  error: null,
  noPolicy: false,
  deleting: false,
  deletionError: null,
};

// Signal-native data service for autoscaler `/v1/apps/{guid}/policy` CRUD.
// Replaces the legacy GetAppAutoscalerPolicyAction / CreateAppAutoscalerPolicyAction
// / UpdateAppAutoscalerPolicyAction / DetachAppAutoscalerPolicyAction Store/
// Effects path for in-package consumers. Speaks the same Stratos session-group
// route the legacy effect speaks (`/pp/v1/autoscaler/apps/{guid}/policy`) —
// there is no autoscaler V3 API, only v1 proxied through Jetstream.
//
// Per-`(endpointGuid, appGuid)` signal cache so multiple apps under the same
// CF endpoint are isolated.
//
// Surface intentionally minimal:
//   policy(cnsi, app)     — Signal<AppAutoscalerPolicyLocal | null>
//   loading(cnsi, app)    — Signal<boolean>
//   error(cnsi, app)      — Signal<string | null>
//   noPolicy(cnsi, app)   — Signal<boolean>  (true after a 404 or detach)
//   deleting(cnsi, app)   — Signal<boolean>  (true while DELETE is in flight)
//   deletionError(c, a)   — Signal<string | null> (last DELETE failure msg)
//   load(cnsi, app)       — Promise<void>; populates the cache
//   update(cnsi, app, p)  — Promise<void>; PUT (covers both create and update)
//   detach(cnsi, app)     — Promise<void>; DELETE; clears the cached policy
@Injectable({ providedIn: 'root' })
export class AutoscalerPolicyDataService {
  private readonly http = inject(HttpClient);
  private readonly state = signal<Map<string, PolicyState>>(new Map());

  private readonly prefix = `/pp/${environment.proxyAPIVersion}/autoscaler`;

  policy(endpointGuid: string, appGuid: string): Signal<AppAutoscalerPolicyLocal | null> {
    return computed(() => this.stateFor(endpointGuid, appGuid).policy);
  }

  loading(endpointGuid: string, appGuid: string): Signal<boolean> {
    return computed(() => this.stateFor(endpointGuid, appGuid).loading);
  }

  error(endpointGuid: string, appGuid: string): Signal<string | null> {
    return computed(() => this.stateFor(endpointGuid, appGuid).error);
  }

  noPolicy(endpointGuid: string, appGuid: string): Signal<boolean> {
    return computed(() => this.stateFor(endpointGuid, appGuid).noPolicy);
  }

  deleting(endpointGuid: string, appGuid: string): Signal<boolean> {
    return computed(() => this.stateFor(endpointGuid, appGuid).deleting);
  }

  deletionError(endpointGuid: string, appGuid: string): Signal<string | null> {
    return computed(() => this.stateFor(endpointGuid, appGuid).deletionError);
  }

  async load(endpointGuid: string, appGuid: string): Promise<void> {
    this.patch(endpointGuid, appGuid, { loading: true, error: null });
    const headers = this.headers(endpointGuid);
    try {
      const wire = await firstValueFrom(
        this.http.get<AppAutoscalerPolicy>(this.url(appGuid), { headers }),
      );
      const policy = autoscalerTransformArrayToMap(wire);
      this.patch(endpointGuid, appGuid, { policy, loading: false, error: null, noPolicy: false });
    } catch (err) {
      const status = (err as HttpErrorResponse)?.status;
      if (status === 404) {
        this.patch(endpointGuid, appGuid, { policy: null, loading: false, error: null, noPolicy: true });
        return;
      }
      const message = (err as HttpErrorResponse)?.message ?? String(err);
      this.patch(endpointGuid, appGuid, { policy: null, loading: false, error: message, noPolicy: false });
    }
  }

  async update(endpointGuid: string, appGuid: string, policy: AppAutoscalerPolicyLocal): Promise<void> {
    this.patch(endpointGuid, appGuid, { loading: true, error: null });
    const headers = this.headers(endpointGuid);
    const body = autoscalerTransformMapToArray(policy);
    try {
      const wire = await firstValueFrom(
        this.http.put<AppAutoscalerPolicy>(this.url(appGuid), body, { headers }),
      );
      const next = autoscalerTransformArrayToMap(wire);
      this.patch(endpointGuid, appGuid, { policy: next, loading: false, error: null, noPolicy: false });
    } catch (err) {
      const message = (err as HttpErrorResponse)?.message ?? String(err);
      this.patch(endpointGuid, appGuid, { loading: false, error: message });
      throw err;
    }
  }

  async detach(endpointGuid: string, appGuid: string): Promise<void> {
    this.patch(endpointGuid, appGuid, { deleting: true, deletionError: null });
    const headers = this.headers(endpointGuid);
    try {
      await firstValueFrom(this.http.delete(this.url(appGuid), { headers }));
      this.patch(endpointGuid, appGuid, {
        policy: null,
        deleting: false,
        deletionError: null,
        noPolicy: true,
      });
    } catch (err) {
      const message = (err as HttpErrorResponse)?.message ?? String(err);
      this.patch(endpointGuid, appGuid, { deleting: false, deletionError: message });
      throw err;
    }
  }

  private url(appGuid: string): string {
    return `${this.prefix}/apps/${appGuid}/policy`;
  }

  private headers(endpointGuid: string): HttpHeaders {
    return new HttpHeaders({
      'x-cap-api-host': 'autoscaler',
      'x-cap-passthrough': 'true',
      'x-cap-cnsi-list': endpointGuid,
    });
  }

  private key(endpointGuid: string, appGuid: string): string {
    return `${endpointGuid}/${appGuid}`;
  }

  private stateFor(endpointGuid: string, appGuid: string): PolicyState {
    return this.state().get(this.key(endpointGuid, appGuid)) ?? EMPTY;
  }

  private patch(endpointGuid: string, appGuid: string, partial: Partial<PolicyState>): void {
    const k = this.key(endpointGuid, appGuid);
    this.state.update(curr => {
      const next = new Map(curr);
      const prev = next.get(k) ?? EMPTY;
      next.set(k, { ...prev, ...partial });
      return next;
    });
  }
}
