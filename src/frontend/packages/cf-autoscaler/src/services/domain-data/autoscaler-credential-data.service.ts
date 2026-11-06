import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '@stratosui/core';

import { AppAutoscalerCredential } from '../../store/app-autoscaler.types';

// Per-(endpoint, app) state. Keyed by `${endpointGuid}::${appGuid}` so a
// single service instance can manage credentials for multiple apps across
// multiple CF endpoints simultaneously.
interface CredentialState {
  credential: AppAutoscalerCredential | null;
  loading: boolean;
  error: string | null;
}

const EMPTY: CredentialState = { credential: null, loading: false, error: null };

const key = (endpointGuid: string, appGuid: string) => `${endpointGuid}::${appGuid}`;

// Signal-native data service for autoscaler credential CRUD against
// `/v1/apps/{appGuid}/credential` (proxied via Jetstream as
// `/pp/v1/autoscaler/apps/{appGuid}/credential`). Replaces the legacy
// UpdateAppAutoscalerCredentialAction / DeleteAppAutoscalerCredentialAction
// effect-pair for in-package consumers.
//
// Surface intentionally minimal:
//   credential(cnsi, app)             — Signal<AppAutoscalerCredential | null>
//   loading(cnsi, app)                — Signal<boolean>
//   error(cnsi, app)                  — Signal<string | null>
//   create(cnsi, app, body?)          — Promise<AppAutoscalerCredential>
//                                       Body omitted = autoscaler-generated
//                                       random credential. Body present =
//                                       custom username/password.
//   delete(cnsi, app)                 — Promise<void>; clears the cache slot.
@Injectable({ providedIn: 'root' })
export class AutoscalerCredentialDataService {
  private readonly http = inject(HttpClient);
  private readonly state = signal<Map<string, CredentialState>>(new Map());

  private url(appGuid: string): string {
    return `/pp/${environment.proxyAPIVersion}/autoscaler/apps/${appGuid}/credential`;
  }

  credential(endpointGuid: string, appGuid: string): Signal<AppAutoscalerCredential | null> {
    return computed(() => this.stateFor(endpointGuid, appGuid).credential);
  }

  loading(endpointGuid: string, appGuid: string): Signal<boolean> {
    return computed(() => this.stateFor(endpointGuid, appGuid).loading);
  }

  error(endpointGuid: string, appGuid: string): Signal<string | null> {
    return computed(() => this.stateFor(endpointGuid, appGuid).error);
  }

  async create(
    endpointGuid: string,
    appGuid: string,
    credential?: AppAutoscalerCredential,
  ): Promise<AppAutoscalerCredential> {
    this.patch(endpointGuid, appGuid, { loading: true, error: null });
    const headers = this.headers(endpointGuid);
    try {
      const body = credential ?? null;
      const result = await firstValueFrom(
        this.http.put<AppAutoscalerCredential>(this.url(appGuid), body, { headers }),
      );
      this.patch(endpointGuid, appGuid, { credential: result, loading: false, error: null });
      return result;
    } catch (err) {
      const message = (err as HttpErrorResponse)?.message ?? String(err);
      this.patch(endpointGuid, appGuid, { loading: false, error: message });
      throw err;
    }
  }

  async delete(endpointGuid: string, appGuid: string): Promise<void> {
    this.patch(endpointGuid, appGuid, { loading: true, error: null });
    const headers = this.headers(endpointGuid);
    try {
      await firstValueFrom(this.http.delete(this.url(appGuid), { headers }));
      this.patch(endpointGuid, appGuid, { credential: null, loading: false, error: null });
    } catch (err) {
      const message = (err as HttpErrorResponse)?.message ?? String(err);
      this.patch(endpointGuid, appGuid, { loading: false, error: message });
      throw err;
    }
  }

  private headers(endpointGuid: string): HttpHeaders {
    return new HttpHeaders({
      'x-cap-api-host': 'autoscaler',
      'x-cap-passthrough': 'true',
      'x-cap-cnsi-list': endpointGuid,
    });
  }

  private stateFor(endpointGuid: string, appGuid: string): CredentialState {
    return this.state().get(key(endpointGuid, appGuid)) ?? EMPTY;
  }

  private patch(endpointGuid: string, appGuid: string, partial: Partial<CredentialState>): void {
    this.state.update(curr => {
      const next = new Map(curr);
      const k = key(endpointGuid, appGuid);
      const prev = next.get(k) ?? EMPTY;
      next.set(k, { ...prev, ...partial });
      return next;
    });
  }
}
