import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '@stratosui/core';

import { PaginationResponse } from '../../../../cloud-foundry/src/store/types/cf-api.types';
import { AppAutoscalerEvent } from '../../store/app-autoscaler.types';

// Per-(endpoint, app) state. Keyed by `${endpointGuid}::${appGuid}` so a
// single service instance can manage scaling-history reads for multiple apps
// across multiple CF endpoints simultaneously.
interface ScalingHistoryState {
  events: AppAutoscalerEvent[];
  totalResults: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

const EMPTY: ScalingHistoryState = {
  events: [],
  totalResults: 0,
  totalPages: 0,
  loading: false,
  error: null,
};

const key = (endpointGuid: string, appGuid: string) => `${endpointGuid}::${appGuid}`;

// Optional query params accepted by the autoscaler `/event` (scaling history)
// endpoint. All keys are passed through as-is to HttpParams so the UI keeps
// the legacy contract (`start-time`, `end-time`, `page`, `results-per-page`,
// `order-direction`, `order-direction-field`).
export type ScalingHistoryQueryParams = Record<string, string | number | undefined>;

// Signal-native data service for autoscaler scaling-history reads against
// `/v1/apps/{appGuid}/scaling_histories` (proxied via Jetstream as
// `/pp/v1/autoscaler/apps/{appGuid}/event`). Replaces the legacy
// GetAppAutoscalerScalingHistoryAction effect path for in-package
// consumers that just need the latest fetched page.
//
// Surface intentionally minimal:
//   events(cnsi, app)         — Signal<AppAutoscalerEvent[]>
//   totalResults(cnsi, app)   — Signal<number>
//   totalPages(cnsi, app)     — Signal<number>
//   loading(cnsi, app)        — Signal<boolean>
//   error(cnsi, app)          — Signal<string | null>
//   load(cnsi, app, params?)  — Promise<void>; populates the cache, replacing
//                                any previously cached events for the slot.
//
// The events list-config now consumes this service via
// CfAppAutoscalerEventsSignalConfigService — the legacy
// CfAppAutoscalerEventsConfigService / CfAppAutoscalerEventsDataSource
// pair was retired in wave-3 along with their @ngrx Store dispatches.
@Injectable({ providedIn: 'root' })
export class AutoscalerScalingHistoryDataService {
  private readonly http = inject(HttpClient);
  private readonly state = signal<Map<string, ScalingHistoryState>>(new Map());

  private url(appGuid: string): string {
    return `/pp/${environment.proxyAPIVersion}/autoscaler/apps/${appGuid}/event`;
  }

  events(endpointGuid: string, appGuid: string): Signal<AppAutoscalerEvent[]> {
    return computed(() => this.stateFor(endpointGuid, appGuid).events);
  }

  totalResults(endpointGuid: string, appGuid: string): Signal<number> {
    return computed(() => this.stateFor(endpointGuid, appGuid).totalResults);
  }

  totalPages(endpointGuid: string, appGuid: string): Signal<number> {
    return computed(() => this.stateFor(endpointGuid, appGuid).totalPages);
  }

  loading(endpointGuid: string, appGuid: string): Signal<boolean> {
    return computed(() => this.stateFor(endpointGuid, appGuid).loading);
  }

  error(endpointGuid: string, appGuid: string): Signal<string | null> {
    return computed(() => this.stateFor(endpointGuid, appGuid).error);
  }

  async load(
    endpointGuid: string,
    appGuid: string,
    params?: ScalingHistoryQueryParams,
  ): Promise<void> {
    this.patch(endpointGuid, appGuid, { loading: true, error: null });
    const headers = this.headers(endpointGuid);
    const httpParams = this.buildParams(params);
    try {
      const resp = await firstValueFrom(
        this.http.get<PaginationResponse<AppAutoscalerEvent>>(this.url(appGuid), {
          headers,
          params: httpParams,
        }),
      );
      this.patch(endpointGuid, appGuid, {
        events: resp?.resources ?? [],
        totalResults: resp?.total_results ?? 0,
        totalPages: resp?.total_pages ?? 0,
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = (err as HttpErrorResponse)?.message ?? String(err);
      this.patch(endpointGuid, appGuid, { loading: false, error: message });
      throw err;
    }
  }

  private buildParams(params?: ScalingHistoryQueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (!params) {
      return httpParams;
    }
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null) {
        return;
      }
      httpParams = httpParams.set(k, String(v));
    });
    return httpParams;
  }

  private headers(endpointGuid: string): HttpHeaders {
    return new HttpHeaders({
      'x-cap-api-host': 'autoscaler',
      'x-cap-passthrough': 'true',
      'x-cap-cnsi-list': endpointGuid,
    });
  }

  private stateFor(endpointGuid: string, appGuid: string): ScalingHistoryState {
    return this.state().get(key(endpointGuid, appGuid)) ?? EMPTY;
  }

  private patch(
    endpointGuid: string,
    appGuid: string,
    partial: Partial<ScalingHistoryState>,
  ): void {
    this.state.update(curr => {
      const next = new Map(curr);
      const k = key(endpointGuid, appGuid);
      const prev = next.get(k) ?? EMPTY;
      next.set(k, { ...prev, ...partial });
      return next;
    });
  }
}
