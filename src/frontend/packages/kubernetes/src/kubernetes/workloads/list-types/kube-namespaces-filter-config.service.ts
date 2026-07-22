import { Injectable, OnDestroy, signal, WritableSignal, computed, Injector, inject, runInInjectionContext } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { EndpointsSignalService, naturalCompare, safeUnsubscribe } from '@stratosui/core';
import { EndpointModel } from '@stratosui/store';
import { Observable, Subscription } from 'rxjs';
import {
  distinctUntilChanged,
  first,
  map,
  startWith,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { KUBERNETES_ENDPOINT_TYPE } from '../../kubernetes-entity-factory';
import { KubeNamespaceDataService } from '../../../services/domain-data/kube-namespace-data.service';
import { KubeNamespace } from '../../../services/endpoint-data/kube-types';

// Helper function to create a signal wrapper compatible with IListMultiFilterConfig
// The wrapper provides BehaviorSubject-like API (.next, .getValue, .asObservable)
// while being backed by a Signal
// MUST be called within an injection context (constructor, field initializer, or runInInjectionContext)
function createSignalWrapper<T>(initialValue: T) {
  const _signal = signal<T>(initialValue);
  // Convert signal to observable within injection context once
  const _observable = toObservable(_signal);

  const wrapper = Object.assign(
    // Make it callable like a signal
    () => _signal(),
    {
      // WritableSignal methods
      set: (value: T) => _signal.set(value),
      update: (fn: (value: T) => T) => _signal.update(fn),
      asReadonly: () => _signal.asReadonly(),
      // BehaviorSubject compatibility methods
      next: (value: T) => _signal.set(value),
      getValue: () => _signal(),
      asObservable: () => _observable,
    }
  );
  return wrapper as WritableSignal<T> & {
    next: (value: T) => void;
    getValue: () => T;
    asObservable: () => Observable<T>;
  };
}

export interface KubernetesNamespacesFilterItem<T = any> {
  list$: Observable<T[]>;
  loading$: Observable<boolean>;
  select: ReturnType<typeof createSignalWrapper<string | undefined>>;
}

// NB: `KubeNamespace` carries `metadata.kubeId` (stamped by the endpoint
// data service), which the namespace filter keys off below.

/**
 * This service relies on OnDestroy, so must be `provided` by a component
 */
@Injectable({
  providedIn: 'root'
})
export class KubernetesNamespacesFilterService implements OnDestroy {
  private endpointsSignals = inject(EndpointsSignalService);
  private namespaceData = inject(KubeNamespaceDataService);

  public kube: KubernetesNamespacesFilterItem<EndpointModel>;
  public namespace: KubernetesNamespacesFilterItem<KubeNamespace>;

  private subs: Subscription[] = [];
  private injector = inject(Injector);

  // Connected K8s endpoints (reactive). Replaces the legacy
  // `connectedEndpointsOfTypesSelector(KUBERNETES_ENDPOINT_TYPE)` read; the
  // legacy selector gated on cnsi_type === KUBERNETES + connected status,
  // mirrored here by filtering the already-connected list.
  private connectedKubeEndpoints = computed(() =>
    this.endpointsSignals.connectedEndpoints()
      .filter(ep => ep?.cnsi_type === KUBERNETES_ENDPOINT_TYPE)
      .sort((a, b) => naturalCompare(a.name, b.name)),
  );

  // All namespaces across the connected kube endpoints, from the signal
  // data service (replaces the legacy getPaginationService(null) read).
  private allNamespacesSig = computed(() =>
    this.namespaceData.allNamespacesAcrossEndpoints(
      this.connectedKubeEndpoints().map(ep => ep.guid).filter((g): g is string => !!g)
    )()
  );

  // Loading mirrors the legacy pagination `busy` gate: true while the initial
  // cross-endpoint namespace refresh is in flight.
  private namespacesLoading = signal<boolean>(true);
  private allNamespacesLoading$ = toObservable(this.namespacesLoading);

  constructor() {
    void this.refreshNamespaces();
    this.kube = this.createKube();
    this.namespace = this.createNamespace();

    // Start watching the namespace plus automatically setting values only when we actually have values to auto select
    this.namespace.list$.pipe(first(undefined, [])).subscribe(() => this.setupAutoSelectors());
  }

  // Prime the per-endpoint namespace caches for every connected kube, then
  // drop the loading flag so dependent filters render.
  private async refreshNamespaces(): Promise<void> {
    const guids = this.connectedKubeEndpoints().map(ep => ep.guid).filter((g): g is string => !!g);
    this.namespacesLoading.set(true);
    await Promise.all(guids.map(g => this.namespaceData.refresh({ kubeGuid: g })));
    this.namespacesLoading.set(false);
  }

  private createKube(): KubernetesNamespacesFilterItem<EndpointModel> {
    return runInInjectionContext(this.injector, () => {
      const list$ = toObservable(this.connectedKubeEndpoints);
      return {
        // Match legacy `first(undefined, [])` semantics so downstream
        // auto-selectors don't EmptyError on init when no endpoints exist.
        list$: list$.pipe(first(undefined, [])),
        // Loading mirrors the legacy "we don't have a list yet" gate. The
        // signal projection always produces an array so loading flips to
        // false on first read; matches the legacy `!kubes` semantics
        // because the signal never emits null.
        loading$: list$.pipe(map(kubes => !kubes)),
        select: createSignalWrapper<string | undefined>(undefined)
      };
    });
  }

  private createNamespace(): KubernetesNamespacesFilterItem<KubeNamespace> {
    // Convert observables to signals within injection context
    return runInInjectionContext(this.injector, () => {
      const kubeSelectSignal = toSignal(
        this.kube.select.asObservable(),
        { initialValue: '' }
      );

      // Use computed for derived list — filter the cross-endpoint namespace
      // signal down to the selected kube.
      const namespaceListComputed = computed(() => {
        const selectedKubeId = kubeSelectSignal();
        const entities = this.allNamespacesSig();
        if (selectedKubeId && entities) {
          return entities
            .filter((namespace: KubeNamespace) => namespace.metadata?.kubeId === selectedKubeId)
            .sort((a: KubeNamespace, b: KubeNamespace) => naturalCompare(a.metadata?.name ?? '', b.metadata?.name ?? ''));
        }
        return [];
      });

      // Convert computed to Observable for backward compatibility
      const namespaceList$ = toObservable(namespaceListComputed);

      return {
        list$: namespaceList$,
        loading$: this.allNamespacesLoading$,
        select: createSignalWrapper<string | undefined>(undefined)
      };
    });
  }

  private setupAutoSelectors() {
    // Convert kube.select Observable to signal for reactive auto-selection
    const kubeSelectObservable$ = this.kube.select.asObservable().pipe(
      startWith(undefined),
      distinctUntilChanged(),
      withLatestFrom(this.namespace.list$),
      tap(([, namespaces]) => {
        if (!!namespaces.length && namespaces.length === 1) {
          this.selectSet(this.namespace.select, namespaces[0].metadata.name);
        } else {
          this.selectSet(this.namespace.select, undefined);
        }
      }),
    );

    const namespaceResetSub = kubeSelectObservable$.subscribe();
    this.subs.push(namespaceResetSub);
  }

  private selectSet(selectWrapper: ReturnType<typeof createSignalWrapper<string | undefined>>, newValue: string | undefined) {
    if (selectWrapper() !== newValue) {
      selectWrapper.set(newValue);
    }
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  destroy() {
    // OnDestroy will be called when the component the service is provided at is destroyed. In theory this should not need to be called
    // separately, if you see error's first ensure the service is provided at a component that will be destroyed
    // Should be called in the OnDestroy of the component where it's provided
    safeUnsubscribe(...this.subs);
  }
}
