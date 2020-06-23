import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { safeUnsubscribe } from 'frontend/packages/core/src/core/utils.service';
import { AppState } from 'frontend/packages/store/src/app-state';
import { connectedEndpointsOfTypesSelector } from 'frontend/packages/store/src/selectors/endpoint.selectors';
import { EndpointModel } from 'frontend/packages/store/src/types/endpoint.types';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
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

import { getCurrentPageRequestInfo } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.types';
import { kubeEntityCatalog } from '../../kubernetes-entity-catalog';
import { KUBERNETES_ENDPOINT_TYPE } from '../../kubernetes-entity-factory';
import { KubernetesNamespace } from '../../store/kube.types';

export interface KubernetesNamespacesFilterItem<T = any> {
  list$: Observable<T[]>;
  loading$: Observable<boolean>;
  select: BehaviorSubject<string>;
}

/**
 * This service relies on OnDestroy, so must be `provided` by a component
 */
@Injectable()
export class KubernetesNamespacesFilterService implements OnDestroy {
  public kube: KubernetesNamespacesFilterItem<EndpointModel>;
  public namespace: KubernetesNamespacesFilterItem<KubernetesNamespace>;

  private subs: Subscription[] = [];

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

  private createKube() {
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
      select: new BehaviorSubject(undefined)
    };
  }

  private createNamespace() {
    const namespaceList$ = combineLatest(
      this.kube.select.asObservable(),
      this.allNamespaces.entities$
    ).pipe(map(([selectedKubeId, entities]) => {
      if (selectedKubeId && entities) {
        return entities
          .filter(namespace => namespace.metadata.kubeId === selectedKubeId)
          .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
      }
      return [];
    }));

    return {
      list$: namespaceList$,
      loading$: this.allNamespacesLoading$,
      select: new BehaviorSubject(undefined)
    };
  }

  private setupAutoSelectors() {
    const namespaceResetSub = this.kube.select.asObservable().pipe(
      startWith(undefined),
      distinctUntilChanged(),
      withLatestFrom(this.namespace.list$),
      tap(([, namespaces]) => {
        if (!!namespaces.length && namespaces.length === 1
        ) {
          this.selectSet(this.namespace.select, namespaces[0].metadata.name);
        } else {
          this.selectSet(this.namespace.select, undefined);
        }
      }),
    ).subscribe();
    this.subs.push(namespaceResetSub);
  }

  private selectSet(select: BehaviorSubject<string>, newValue: string) {
    if (select.getValue() !== newValue) {
      select.next(newValue);
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
