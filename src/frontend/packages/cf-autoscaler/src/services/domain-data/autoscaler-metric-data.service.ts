import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '@stratosui/core';

import { PaginationResponse } from '../../../../cloud-foundry/src/store/types/cf-api.types';
import { AppAutoscalerMetricData } from '../../store/app-autoscaler.types';

// Time-window query for the autoscaler aggregated_metric_histories
// endpoint. Mirrors the legacy `AutoscalerPaginationParams` shape so
// existing callers can hand the same params they assembled previously.
export interface AutoscalerMetricQueryParams {
  'start-time': string;
  'end-time': string;
  page?: string;
  'results-per-page'?: string;
  'order-direction'?: 'asc' | 'desc';
  'order'?: string;
}

interface MetricState {
  metrics: AppAutoscalerMetricData[];
  loading: boolean;
  error: string | null;
}

const EMPTY: MetricState = { metrics: [], loading: false, error: null };

const key = (endpointGuid: string, appGuid: string, metricType: string) =>
  `${endpointGuid}::${appGuid}::${metricType}`;

// Signal-native data service for autoscaler aggregated metric history
// reads against `/v1/apps/{appGuid}/aggregated_metric_histories/{metric_type}`
// (proxied via Jetstream as `/pp/v1/autoscaler/apps/{appGuid}/metric/{metricType}`).
// Replaces the legacy GetAppAutoscalerAppMetricAction effect path for
// in-package consumers (the autoscaler metric chart card).
//
// Per-`(endpointGuid, appGuid, metricType)` state so a single service
// instance can serve every chart on the autoscaler tab simultaneously.
//
// Surface intentionally minimal:
//   metrics(cnsi, app, type)      — Signal<AppAutoscalerMetricData[]>
//   loading(cnsi, app, type)      — Signal<boolean>
//   error(cnsi, app, type)        — Signal<string | null>
//   load(cnsi, app, type, params) — Promise<void>; populates the cache
//
// Consumers that need the formatted/charted local form should pass the
// raw resources to `buildMetricData()` from
// `core/autoscaler-helpers/autoscaler-transform-metric` — keeping the
// transform out of the data service preserves the established split
// (data fetches resources; helpers shape them for charts).
@Injectable({ providedIn: 'root' })
export class AutoscalerMetricDataService {
  private readonly http = inject(HttpClient);
  private readonly state = signal<Map<string, MetricState>>(new Map());

  private url(appGuid: string, metricType: string): string {
    return `/pp/${environment.proxyAPIVersion}/autoscaler/apps/${appGuid}/metric/${metricType}`;
  }

  metrics(endpointGuid: string, appGuid: string, metricType: string): Signal<AppAutoscalerMetricData[]> {
    return computed(() => this.stateFor(endpointGuid, appGuid, metricType).metrics);
  }

  loading(endpointGuid: string, appGuid: string, metricType: string): Signal<boolean> {
    return computed(() => this.stateFor(endpointGuid, appGuid, metricType).loading);
  }

  error(endpointGuid: string, appGuid: string, metricType: string): Signal<string | null> {
    return computed(() => this.stateFor(endpointGuid, appGuid, metricType).error);
  }

  async load(
    endpointGuid: string,
    appGuid: string,
    metricType: string,
    params: AutoscalerMetricQueryParams,
  ): Promise<void> {
    this.patch(endpointGuid, appGuid, metricType, { loading: true, error: null });
    const headers = this.headers(endpointGuid);
    const httpParams = this.buildParams(params);
    try {
      const response = await firstValueFrom(
        this.http.get<PaginationResponse<AppAutoscalerMetricData>>(
          this.url(appGuid, metricType),
          { headers, params: httpParams },
        ),
      );
      const metrics = response?.resources ?? [];
      this.patch(endpointGuid, appGuid, metricType, { metrics, loading: false, error: null });
    } catch (err) {
      const message = (err as HttpErrorResponse)?.message ?? String(err);
      this.patch(endpointGuid, appGuid, metricType, { metrics: [], loading: false, error: message });
    }
  }

  private buildParams(params: AutoscalerMetricQueryParams): HttpParams {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        p = p.set(k, String(v));
      }
    }
    return p;
  }

  private headers(endpointGuid: string): HttpHeaders {
    return new HttpHeaders({
      'x-cap-api-host': 'autoscaler',
      'x-cap-passthrough': 'true',
      'x-cap-cnsi-list': endpointGuid,
    });
  }

  private stateFor(endpointGuid: string, appGuid: string, metricType: string): MetricState {
    return this.state().get(key(endpointGuid, appGuid, metricType)) ?? EMPTY;
  }

  private patch(
    endpointGuid: string,
    appGuid: string,
    metricType: string,
    partial: Partial<MetricState>,
  ): void {
    this.state.update(curr => {
      const next = new Map(curr);
      const k = key(endpointGuid, appGuid, metricType);
      const prev = next.get(k) ?? EMPTY;
      next.set(k, { ...prev, ...partial });
      return next;
    });
  }
}
