import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '@stratosui/core';

import { AutoscalerInfo } from '../../store/app-autoscaler.types';
import { autoscalerErrorMessage } from '../../core/autoscaler-helpers/autoscaler-util';

// Per-endpoint state held in one signal-of-map. Keyed by endpointGuid
// so multiple CF endpoints can be queried independently from the same
// service instance.
interface InfoState {
  info: AutoscalerInfo | null;
  loading: boolean;
  error: string | null;
}

const EMPTY: InfoState = { info: null, loading: false, error: null };

const stateKey = (endpointGuid: string, appGuid?: string) => appGuid ? `${endpointGuid}/${appGuid}` : endpointGuid;

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
//   load(guid)               — Promise<void>; populates the cache
//
// Each takes an optional app GUID: the server then answers from the
// autoscaler that app is bound to (a registered autoscaler endpoint),
// which can differ from the Cloud Foundry's default one. State is kept
// per Cloud Foundry and app.
@Injectable({ providedIn: 'root' })
export class AutoscalerInfoDataService {
  private readonly http = inject(HttpClient);
  private readonly state = signal<Map<string, InfoState>>(new Map());

  private readonly url = `/pp/${environment.proxyAPIVersion}/autoscaler/info`;

  info(endpointGuid: string, appGuid?: string): Signal<AutoscalerInfo | null> {
    const key = stateKey(endpointGuid, appGuid);
    return computed(() => this.stateFor(key).info);
  }

  loading(endpointGuid: string, appGuid?: string): Signal<boolean> {
    const key = stateKey(endpointGuid, appGuid);
    return computed(() => this.stateFor(key).loading);
  }

  error(endpointGuid: string, appGuid?: string): Signal<string | null> {
    const key = stateKey(endpointGuid, appGuid);
    return computed(() => this.stateFor(key).error);
  }

  isAvailable(endpointGuid: string, appGuid?: string): Signal<boolean> {
    const key = stateKey(endpointGuid, appGuid);
    return computed(() => {
      const s = this.stateFor(key);
      return !!s.info && !s.error;
    });
  }

  async load(endpointGuid: string, appGuid?: string): Promise<void> {
    const key = stateKey(endpointGuid, appGuid);
    this.patch(key, { loading: true, error: null });
    const headers = new HttpHeaders({
      'x-cap-api-host': 'autoscaler',
      'x-cap-passthrough': 'true',
      'x-cap-cnsi-list': endpointGuid,
    });
    try {
      const params = appGuid ? { app: appGuid } : undefined;
      const info = await firstValueFrom(this.http.get<AutoscalerInfo>(this.url, { headers, params }));
      this.patch(key, { info, loading: false, error: null });
    } catch (err) {
      const status = (err as HttpErrorResponse)?.status;
      // 404 = autoscaler not configured for this endpoint. Don't treat
      // as an error — leave info null and let isAvailable() report false.
      if (status === 404) {
        this.patch(key, { info: null, loading: false, error: null });
        return;
      }
      const message = autoscalerErrorMessage(err);
      this.patch(key, { info: null, loading: false, error: message });
    }
  }

  private stateFor(key: string): InfoState {
    return this.state().get(key) ?? EMPTY;
  }

  private patch(key: string, partial: Partial<InfoState>): void {
    this.state.update(curr => {
      const next = new Map(curr);
      const prev = next.get(key) ?? EMPTY;
      next.set(key, { ...prev, ...partial });
      return next;
    });
  }
}
