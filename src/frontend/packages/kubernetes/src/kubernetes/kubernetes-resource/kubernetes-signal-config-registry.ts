import { Injectable, Injector, Signal } from '@angular/core';

import { SignalListConfig } from '@stratosui/core';

// Inputs handed to a registry factory by the generic resource shell.
// kubeGuid pins the endpoint; selectedNamespace tracks the namespace
// dropdown ('*' / undefined for "all namespaces" or a concrete name).
// isWorkloadView is set when the route is a workloads sub-route — the
// factory may filter the underlying data accordingly.
export interface KubernetesSignalConfigContext {
  readonly kubeGuid: string;
  readonly selectedNamespace: Signal<string | undefined>;
  readonly isWorkloadView: boolean;
  readonly workloadNamespace?: string;
  readonly workloadTitle?: string;
}

// A registry factory builds the SignalListConfig the generic resource
// shell will hand to <app-signal-list>. The factory runs inside an
// Angular injection context (the shell's injector) so it may inject()
// data services / signal-config services / etc.
export type KubernetesSignalConfigFactory = (
  ctx: KubernetesSignalConfigContext,
  injector: Injector,
) => SignalListConfig<unknown>;

// Registry of signal-native configs keyed by entity catalog `type`
// (e.g. 'pod', 'service', 'namespace'). When the generic resource list
// route resolves an entity type that exists in this registry, the shell
// renders <app-signal-list> with the factory's config; otherwise the
// shell redirects to the cluster summary (there is no legacy list fallback).
//
// Wave-2-genericlist scope: register pods, services, and namespaces
// (the wave-2 signal-configs already in tree). Wave-3 lifts the
// remaining ~14 generic resource types (configMap, secret, pvc, etc.)
// off ngrx into the same registry once their data services land.

@Injectable({ providedIn: 'root' })
export class KubernetesSignalConfigRegistry {
  private readonly factories = new Map<string, KubernetesSignalConfigFactory>();

  register(entityType: string, factory: KubernetesSignalConfigFactory): void {
    this.factories.set(entityType, factory);
  }

  has(entityType: string): boolean {
    return this.factories.has(entityType);
  }

  get(entityType: string): KubernetesSignalConfigFactory | undefined {
    return this.factories.get(entityType);
  }

  unregister(entityType: string): void {
    this.factories.delete(entityType);
  }
}
