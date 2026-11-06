import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '@stratosui/core';

import { AutoscalerInfo } from '../../store/app-autoscaler.types';

// Per-endpoint state held in one signal-of-map. Keyed by endpointGuid
// so multiple CF endpoints can be queried independently from the same
// service instance.
interface InfoState {
  info: AutoscalerInfo | null;
  loading: boolean;
  error: string | null;
}

const EMPTY: InfoState = { info: null, loading: false, error: null };

// Signal-native data service for autoscaler `/v1/info`. Replaces the
// legacy fetchAutoscalerInfo + Store/Effects path for in-package
// consumers. Speaks the same Stratos session-group route the legacy
// effect speaks (`/pp/v1/autoscaler/info`) — there is no autoscaler
// V3 API, only v1 proxied through Jetstream.
//
// Surface intentionally minimal:
//   info(guid)               — Signal<AutoscalerInfo|null>
//   loading(guid)            — Signal<boolean>
//   error(guid)              — Signal<string|null> (null on 404 — that
//                              just means autoscaler isn't configured)
//   isAvailable(guid)        — Signal<boolean>  (info present, no error)
//   canManageCredentials(g)  — Signal<boolean>  (build major >= 3)
//   load(guid)               — Promise<void>; populates the cache
@Injectable({ providedIn: 'root' })
export class AutoscalerInfoDataService {
  private readonly http = inject(HttpClient);
  private readonly state = signal<Map<string, InfoState>>(new Map());

  private readonly url = `/pp/${environment.proxyAPIVersion}/autoscaler/info`;

  info(endpointGuid: string): Signal<AutoscalerInfo | null> {
    return computed(() => this.stateFor(endpointGuid).info);
  }

  loading(endpointGuid: string): Signal<boolean> {
    return computed(() => this.stateFor(endpointGuid).loading);
  }

  error(endpointGuid: string): Signal<string | null> {
    return computed(() => this.stateFor(endpointGuid).error);
  }

  isAvailable(endpointGuid: string): Signal<boolean> {
    return computed(() => {
      const s = this.stateFor(endpointGuid);
      return !!s.info && !s.error;
    });
  }

  // Mirrors the legacy `canManageCredentials$` derivation in the
  // autoscaler-tab-extension component — autoscaler builds >= 3.x
  // expose the credential management endpoints.
  canManageCredentials(endpointGuid: string): Signal<boolean> {
    return computed(() => {
      const s = this.stateFor(endpointGuid);
      if (!s.info || s.error) {
        return false;
      }
      const build = s.info.build;
      if (!build || typeof build !== 'string') {
        return false;
      }
      const parts = build.split('.');
      if (parts.length === 0) {
        return false;
      }
      const major = Number.parseInt(parts[0], 10);
      return Number.isFinite(major) && major >= 3;
    });
  }

  async load(endpointGuid: string): Promise<void> {
    this.patch(endpointGuid, { loading: true, error: null });
    const headers = new HttpHeaders({
      'x-cap-api-host': 'autoscaler',
      'x-cap-passthrough': 'true',
      'x-cap-cnsi-list': endpointGuid,
    });
    try {
      const info = await firstValueFrom(this.http.get<AutoscalerInfo>(this.url, { headers }));
      this.patch(endpointGuid, { info, loading: false, error: null });
    } catch (err) {
      const status = (err as HttpErrorResponse)?.status;
      // 404 = autoscaler not configured for this endpoint. Don't treat
      // as an error — leave info null and let isAvailable() report false.
      if (status === 404) {
        this.patch(endpointGuid, { info: null, loading: false, error: null });
        return;
      }
      const message = (err as HttpErrorResponse)?.message ?? String(err);
      this.patch(endpointGuid, { info: null, loading: false, error: message });
    }
  }

  private stateFor(endpointGuid: string): InfoState {
    return this.state().get(endpointGuid) ?? EMPTY;
  }

  private patch(endpointGuid: string, partial: Partial<InfoState>): void {
    this.state.update(curr => {
      const next = new Map(curr);
      const prev = next.get(endpointGuid) ?? EMPTY;
      next.set(endpointGuid, { ...prev, ...partial });
      return next;
    });
  }
}
