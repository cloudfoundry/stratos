import { Injectable, OnDestroy, signal, WritableSignal, computed, Injector, inject, runInInjectionContext } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { safeUnsubscribe } from 'frontend/packages/core/src/core/utils.service';
import { AppState } from 'frontend/packages/store/src/app-state';
import { connectedEndpointsOfTypesSelector } from 'frontend/packages/store/src/selectors/endpoint.selectors';
import { EndpointModel } from 'frontend/packages/store/src/types/endpoint.types';
import { Observable, Subscription } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  first,
  map,
  publishReplay,
  refCount,
  startWith,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import { getCurrentPageRequestInfo } from '../../../../../store/src/reducers/pagination-reducer/pagination-reducer.types';
import { KUBERNETES_ENDPOINT_TYPE } from '../../kubernetes-entity-factory';
import { kubeEntityCatalog } from '../../kubernetes-entity-generator';
import { KubernetesNamespace } from '../../store/kube.types';

// Helper function to create a signal wrapper compatible with IListMultiFilterConfig
// The wrapper provides BehaviorSubject-like API (.next, .getValue, .asObservable)
// while being backed by a Signal
function createSignalWrapper<T>(initialValue: T) {
  const _signal = signal<T>(initialValue);
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
      asObservable: () => toObservable(_signal),
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
  select: ReturnType<typeof createSignalWrapper<string>>;
}

/**
 * This service relies on OnDestroy, so must be `provided` by a component
 */
@Injectable({
  providedIn: 'root'
})
export class KubernetesNamespacesFilterService implements OnDestroy {
  public kube: KubernetesNamespacesFilterItem<EndpointModel>;
  public namespace: KubernetesNamespacesFilterItem<KubernetesNamespace>;

  private subs: Subscription[] = [];
  private injector = inject(Injector);

  private allNamespaces = this.getNamespacesObservable();
  private allNamespacesLoading$ = this.allNamespaces.pagination$.pipe(map(
    pag => getCurrentPageRequestInfo(pag).busy
  ));

  constructor(
    private store: Store<AppState>,
  ) {
    this.kube = this.createKube();
    this.namespace = this.createNamespace();

    // Start watching the namespace plus automatically setting values only when we actually have values to auto select
    this.namespace.list$.pipe(first()).subscribe(() => this.setupAutoSelectors());
  }

  private getNamespacesObservable() {
    return kubeEntityCatalog.namespace.store.getPaginationService(null);
  }

  private createKube(): KubernetesNamespacesFilterItem<EndpointModel> {
    const list$ = this.store.select(connectedEndpointsOfTypesSelector(KUBERNETES_ENDPOINT_TYPE)).pipe(
      // Ensure we have endpoints
      filter(endpoints => endpoints && !!Object.keys(endpoints).length),
      publishReplay(1),
      refCount(),
    );

    return {
      list$: list$.pipe(
        map(endpoints => Object.values(endpoints)),
        first(),
        map((endpoints: EndpointModel[]) => {
          return Object.values(endpoints).sort((a: EndpointModel, b: EndpointModel) => a.name.localeCompare(b.name));
        }),
      ),
      loading$: list$.pipe(map(kubes => !kubes)),
      select: createSignalWrapper<string>(undefined)
    };
  }

  private createNamespace(): KubernetesNamespacesFilterItem<KubernetesNamespace> {
    // Convert observables to signals within injection context
    return runInInjectionContext(this.injector, () => {
      const kubeSelectSignal = toSignal(
        this.kube.select.asObservable(),
        { initialValue: '' }
      );

      const allNamespacesSignal = toSignal(
        this.allNamespaces.entities$,
        { initialValue: [] as KubernetesNamespace[] }
      );

      // Use computed for derived list
      const namespaceListComputed = computed(() => {
        const selectedKubeId = kubeSelectSignal();
        const entities = allNamespacesSignal();
        if (selectedKubeId && entities) {
          return (entities as KubernetesNamespace[])
            .filter((namespace: KubernetesNamespace) => namespace.metadata?.kubeId === selectedKubeId)
            .sort((a: KubernetesNamespace, b: KubernetesNamespace) => (a.metadata?.name ?? '').localeCompare(b.metadata?.name ?? ''));
        }
        return [];
      });

      // Convert computed to Observable for backward compatibility
      const namespaceList$ = toObservable(namespaceListComputed);

      return {
        list$: namespaceList$,
        loading$: this.allNamespacesLoading$,
        select: createSignalWrapper<string>(undefined)
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

  private selectSet(selectWrapper: ReturnType<typeof createSignalWrapper<string>>, newValue: string) {
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
