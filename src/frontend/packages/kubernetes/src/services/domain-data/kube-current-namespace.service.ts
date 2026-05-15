import { Injectable, Signal, computed, signal } from '@angular/core';

// Signal-native replacement for the legacy `k8sCurrentNamespace` ngrx
// reducer. Tracks the user's selected namespace per kubernetes endpoint
// — used by the resource-list shell to drive the namespaced-vs-cluster
// fetch path.
//
// Wave-3.5 (slice K-final) replaces:
//   - `SetCurrentNamespaceAction` dispatch path
//   - `KUBERNETES_CURRENT_NAMESPACE` reducer slice (`store.select('k8sCurrentNamespace')`)
//
// Consumers call `set(endpoint, namespace)` to write and `forEndpoint(endpoint)`
// to read the per-endpoint signal. A wildcard `*` namespace is preserved
// from the legacy contract — callers map `*` to "no namespace selected".

@Injectable({ providedIn: 'root' })
export class KubeCurrentNamespaceService {
  // Per-endpoint selection map. Mutating via .update() so consumer signals
  // re-fire when any endpoint's selection changes.
  private readonly _selections = signal<Record<string, string>>({});

  // Public readonly view of the entire map. Most consumers want a per-
  // endpoint signal; use forEndpoint() for that. This getter mirrors the
  // legacy `state.k8sCurrentNamespace` shape for any consumer that prefers
  // the full record.
  readonly selections: Signal<Record<string, string>> = this._selections.asReadonly();

  // Per-endpoint signal. Returns the selected namespace string, or
  // undefined if the user has not yet selected one for that endpoint.
  // The wildcard `*` means "all namespaces" — callers translate as needed.
  forEndpoint(endpoint: string): Signal<string | undefined> {
    return computed(() => this._selections()[endpoint]);
  }

  // Imperative setter — mirrors the legacy SetCurrentNamespaceAction
  // dispatch. Pass `undefined` / `null` to clear the selection.
  set(endpoint: string, namespace: string | undefined | null): void {
    this._selections.update(curr => {
      if (namespace == null) {
        if (!(endpoint in curr)) return curr;
        const next = { ...curr };
        delete next[endpoint];
        return next;
      }
      if (curr[endpoint] === namespace) return curr;
      return { ...curr, [endpoint]: namespace };
    });
  }

  // Snapshot accessor for non-reactive consumers.
  current(endpoint: string): string | undefined {
    return this._selections()[endpoint];
  }
}
