import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, Injector, Signal, computed, effect, inject, runInInjectionContext, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { MetricQueryConfig, getFullMetricQueryQuery } from '../actions/metrics.actions';
import { httpErrorResponseToSafeString } from '../jetstream';
import { IMetrics, IMetricsData, IMetricsResponse } from '../types/base-metric.types';
import { MetricQueryType } from '../types/metric.types';

// Shape that captures the V2 MetricsAction's HTTP-relevant payload without
// any ngrx/entity-catalog coupling. Consumers build a MetricsRequest, hand it
// to the service, and get back the resolved IMetrics. Replaces the legacy
// FetchXxxMetricsAction family (cf-metrics.actions.ts in cloud-foundry).
//
// URL convention matches metrics.effects.ts:
//   `${url}/${queryType}?query=${getFullMetricQueryQuery(query)}`
// e.g. /pp/v1/metrics/cf/cells/query?query=firehose_value_metric_rep_garden_health_check_failed
export interface MetricsRequest {
  endpointGuid: string;
  url: string;
  query: MetricQueryConfig;
  queryType: MetricQueryType;
  windowValue?: string | null;
}

export interface MetricsFetchState<T = any> {
  metrics: IMetrics<T> | null;
  fetching: boolean;
  error: string | null;
}

const EMPTY_STATE: MetricsFetchState = { metrics: null, fetching: false, error: null };

export interface MetricsObservation<T = any> {
  metrics: Signal<IMetrics<T> | null>;
  fetching: Signal<boolean>;
  error: Signal<string | null>;
  refresh: () => Promise<void>;
  stop: () => void;
}

@Injectable({ providedIn: 'root' })
export class MetricsDataService {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);

  // One-shot fetch. Mirrors metrics.effects.ts:metrics$ — same URL build,
  // same x-cap-cnsi-list header, same response unwrap. Returns the IMetrics
  // payload for the requested endpoint (null when Jetstream returns no
  // entry for that endpoint).
  async fetch<T = any>(req: MetricsRequest): Promise<IMetrics<T> | null> {
    const fullUrl = `${req.url}/${req.queryType}?query=${getFullMetricQueryQuery(req.query)}`;
    const response = await firstValueFrom(
      this.http.get<{ [cfguid: string]: IMetricsResponse<T> }>(fullUrl, {
        headers: { 'x-cap-cnsi-list': req.endpointGuid },
      })
    );
    const entry = response?.[req.endpointGuid];
    if (!entry) {
      return null;
    }
    // IMetricsResponse.data is declared as IMetrics<T> in the type file but
    // the runtime payload is the inner IMetricsData<T> ({ resultType, result }).
    // The legacy MetricsEffect performs the same unwrap implicitly. Cast at
    // the boundary so downstream consumers see the correct shape.
    return {
      query: req.query,
      windowValue: req.windowValue ?? null,
      data: entry.data as unknown as IMetricsData<T>,
    };
  }

  // Signal-bound observation. Tracks `request()`; whenever the request
  // signal changes, a new fetch fires and the metrics/fetching/error
  // signals update. Optional poll interval re-fires on a timer. The
  // returned `stop()` cancels the polling timer.
  //
  // Caller owns the lifetime — pass a DestroyRef-bound effect cleanup
  // (or call stop() explicitly) when the consumer component tears down.
  observe<T = any>(
    request: Signal<MetricsRequest | null>,
    options: { pollIntervalMs?: Signal<number> | number } = {},
  ): MetricsObservation<T> {
    const state = signal<MetricsFetchState<T>>(EMPTY_STATE);
    let inFlightToken = 0;
    let timerId: ReturnType<typeof setInterval> | null = null;

    const runFetch = async (req: MetricsRequest | null) => {
      if (!req) {
        state.set(EMPTY_STATE);
        return;
      }
      const token = ++inFlightToken;
      state.update(s => ({ ...s, fetching: true, error: null }));
      try {
        const result = await this.fetch<T>(req);
        if (token !== inFlightToken) return;
        state.set({ metrics: result, fetching: false, error: null });
      } catch (err) {
        if (token !== inFlightToken) return;
        const message = err instanceof HttpErrorResponse
          ? httpErrorResponseToSafeString(err)
          : (err instanceof Error ? err.message : String(err));
        state.set({ metrics: null, fetching: false, error: message });
      }
    };

    // observe() may be called from inside an Angular lifecycle hook
    // (e.g. ngOnInit), which is not itself an injection context. We
    // anchor effect() to the service's captured injector so the
    // signal -> fetch wire works regardless of caller context.
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const req = request();
        if (timerId !== null) {
          clearInterval(timerId);
          timerId = null;
        }
        untracked(() => { void runFetch(req); });
        const interval = typeof options.pollIntervalMs === 'number'
          ? options.pollIntervalMs
          : options.pollIntervalMs?.();
        if (interval && interval > 0 && req) {
          timerId = setInterval(() => { void runFetch(request()); }, interval);
        }
      });
    });

    return {
      metrics: computed(() => state().metrics),
      fetching: computed(() => state().fetching),
      error: computed(() => state().error),
      refresh: () => runFetch(request()),
      stop: () => {
        if (timerId !== null) {
          clearInterval(timerId);
          timerId = null;
        }
        inFlightToken++;
      },
    };
  }
}
