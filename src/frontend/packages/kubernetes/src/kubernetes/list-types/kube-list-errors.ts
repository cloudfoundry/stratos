import { Signal, computed } from '@angular/core';

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
