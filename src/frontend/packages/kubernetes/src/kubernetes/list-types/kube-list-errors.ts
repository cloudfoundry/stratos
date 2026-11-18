import { HttpErrorResponse } from '@angular/common/http';
import { EffectRef, Injector, Signal, computed, effect } from '@angular/core';
import { EndpointErrorEventsService } from '@stratosui/store';

import { StratosError } from '../../services/endpoint-data/kube-types';

// Failed-load wiring for a Kubernetes <app-signal-list>. `errors` are
// the failures recorded by the load(s) behind the list, already scoped
// to it. While there are any, errorsByCnsi names the endpoint, which
// gives an empty list the failed-load state with its Retry button, and
// errorDetail carries the newest failure's reason. The loads clear
// their errors when they succeed, so a Retry that works ends the state.
export function kubeListErrorState(kubeGuid: string, errors: Signal<StratosError[]>): {
  errorsByCnsi: Signal<Map<string, unknown>>;
  errorDetail: Signal<string | undefined>;
} {
  return {
    errorsByCnsi: computed(() => {
      const errs = errors();
      return new Map<string, unknown>(errs.length ? [[kubeGuid, errs]] : []);
    }),
    errorDetail: computed(() => {
      const errs = errors();
      const newest = errs[errs.length - 1];
      return newest ? (newest.detail || newest.title) : undefined;
    }),
  };
}

// The errors recorded against one endpoint, for data services whose
// errors carry the endpoint guid in `affected`.
export function errorsForEndpoint(kubeGuid: string, errors: Signal<StratosError[]>): Signal<StratosError[]> {
  return computed(() => errors().filter(e => e.affected?.includes(kubeGuid)));
}

// Feeds a list's failures (an errorsByCnsi map whose values are a
// StratosError or a list of them) to the endpoint error history behind
// the page-header error banner and /errors/:endpointId, as CF list pages
// do with wireEndpointErrorReporting. Each endpoint's newest failure goes
// in as an HttpErrorResponse so the history keeps its status and reason.
// The effect ends with the injector (the list's page).
export function reportKubeListErrors(
  errorsByCnsi: Signal<ReadonlyMap<string, unknown>>,
  injector: Injector,
): EffectRef {
  const events = injector.get(EndpointErrorEventsService);
  return effect(() => {
    const byEndpoint = new Map<string, HttpErrorResponse>();
    errorsByCnsi().forEach((value, guid) => {
      const errs = (Array.isArray(value) ? value : [value]) as StratosError[];
      const newest = errs[errs.length - 1];
      if (newest) {
        byEndpoint.set(guid, new HttpErrorResponse({ status: newest.status ?? 0, error: newest.detail || newest.title }));
      }
    });
    events.recordEndpointErrors(byEndpoint);
  }, { injector });
}
