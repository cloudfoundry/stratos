import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '@stratosui/core';

import { AppAutoscalerHealth } from '../../store/app-autoscaler.types';

interface HealthState {
  health: AppAutoscalerHealth | null;
  loading: boolean;
  error: string | null;
}

const EMPTY: HealthState = { health: null, loading: false, error: null };

// Signal-native data service for autoscaler `/v1/health`. Mirrors the
// shape of AutoscalerInfoDataService — per-endpoint signal cache,
// direct HttpClient, no Store/Effects. 404/503 are treated as
// "not configured / temporarily unavailable", not as errors.
@Injectable({ providedIn: 'root' })
export class AutoscalerHealthDataService {
  private readonly http = inject(HttpClient);
  private readonly state = signal<Map<string, HealthState>>(new Map());

  private readonly url = `/pp/${environment.proxyAPIVersion}/autoscaler/health`;

  health(endpointGuid: string): Signal<AppAutoscalerHealth | null> {
    return computed(() => this.stateFor(endpointGuid).health);
  }

  loading(endpointGuid: string): Signal<boolean> {
    return computed(() => this.stateFor(endpointGuid).loading);
  }

  error(endpointGuid: string): Signal<string | null> {
    return computed(() => this.stateFor(endpointGuid).error);
  }

  isHealthy(endpointGuid: string): Signal<boolean> {
    return computed(() => {
      const s = this.stateFor(endpointGuid);
      return !!s.health && !s.error;
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
      const health = await firstValueFrom(this.http.get<AppAutoscalerHealth>(this.url, { headers }));
      this.patch(endpointGuid, { health, loading: false, error: null });
    } catch (err) {
      const status = (err as HttpErrorResponse)?.status;
      if (status === 404 || status === 503) {
        this.patch(endpointGuid, { health: null, loading: false, error: null });
        return;
      }
      const message = (err as HttpErrorResponse)?.message ?? String(err);
      this.patch(endpointGuid, { health: null, loading: false, error: message });
    }
  }

  private stateFor(endpointGuid: string): HealthState {
    return this.state().get(endpointGuid) ?? EMPTY;
  }

  private patch(endpointGuid: string, partial: Partial<HealthState>): void {
    this.state.update(curr => {
      const next = new Map(curr);
      const prev = next.get(endpointGuid) ?? EMPTY;
      next.set(endpointGuid, { ...prev, ...partial });
      return next;
    });
  }
}
