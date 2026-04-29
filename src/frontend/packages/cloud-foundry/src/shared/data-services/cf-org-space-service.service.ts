import { Injectable, OnDestroy, Signal, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toObservable } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, defer, EMPTY, Observable, of, Subscription } from 'rxjs';
import { take,
  catchError,
  distinctUntilChanged,
  filter,
  map,
  publishReplay,
  refCount,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';

import { ListPaginationMultiFilterChange, naturalCompare, safeUnsubscribe, valueOrCommonFalsy } from '@stratosui/core';
import {
  APIResource,
  connectedEndpointsOfTypesSelector,
  EndpointModel,
  getCurrentPageRequestInfo,
  getPaginationObservables,
  PaginatedAction,
  PaginationEntityState,
  PaginationMonitorFactory,
  PaginationParam,
  ResetPagination,
  SetParams
} from '@stratosui/store';
import { CFAppState } from '../../cf-app-state';
import { organizationEntityType, spaceEntityType } from '../../cf-entity-types';
import { createEntityRelationKey } from '../../entity-relations/entity-relations.types';
import { IOrganization, ISpace } from '../../cf-api.types';
import { cfEntityCatalog } from '../../cf-entity-catalog';
import { cfEntityFactory } from '../../cf-entity-factory';
import { CF_ENDPOINT_TYPE } from '../../cf-types';
import { QParam, QParamJoiners } from '../q-param';
import { CfOrgSpaceDebug, createCfOrgSpaceDebug } from './cf-org-space-debug';

export function spreadPaginationParams(params: PaginationParam): PaginationParam {
  return {
    ...params
  };
}


export function createCfOrgSpaceFilterConfig(key: string, label: string, cfOrgSpaceItem: CfOrgSpaceItem) {
  return {
    key,
    label,
    ...cfOrgSpaceItem,
    list$: cfOrgSpaceItem.list$.pipe(map((entities: any[]) => {
      return entities.map(entity => ({
        label: entity.name,
        item: entity,
        value: entity.guid
      }));
    })),
  };
}

export interface CfOrgSpaceItem<T = any> {
  list$: Observable<T[]>;
  loading$: Observable<boolean>;
  // Signal-based selection with backward compatibility via BehaviorSubject wrapper
  select: BehaviorSubject<string>;
}

export const enum CfOrgSpaceSelectMode {
  /**
   * When a parent selection changes and it contains only one child automatically select it, otherwise clear child selection
   */
  FIRST_ONLY = 1,
  /**
   * When a parent selection changes and it contains any children automatically select the first one, otherwise clear child selection
   */
  ANY = 2
}

export const createCfOrSpaceMultipleFilterFn = (
  store: Store<CFAppState>,
  action: PaginatedAction,
  setQParam: (setQ: QParam, qs: QParam[]) => boolean,
  preResetUpdate?: () => void
) => {
  return (changes: ListPaginationMultiFilterChange[], params: PaginationParam) => {
    if (!changes.length) {
      return;
    }
    const qParamStrings = (params.q || []) as string[];
    const qParamObject = QParam.fromStrings(qParamStrings);

    const startingCfGuid = valueOrCommonFalsy(action.endpointGuid);
    const startingOrgGuid = valueOrCommonFalsy(qParamObject.find((q: QParam) => q.key === 'organization_guid'), {}).value;
    const startingSpaceGuid = valueOrCommonFalsy(qParamObject.find((q: QParam) => q.key === 'space_guid'), {}).value;

    const qChanges = changes.reduce((qs: QParam[], change) => {
      switch (change.key) {
        case 'cf':
          action.endpointGuid = change.value;
          setQParam(new QParam('organization_guid', '', QParamJoiners.in), qs);
          setQParam(new QParam('space_guid', '', QParamJoiners.in), qs);
          break;
        case 'org':
          setQParam(new QParam('organization_guid', change.value, QParamJoiners.in), qs);
          break;
        case 'space':
          setQParam(new QParam('space_guid', change.value, QParamJoiners.in), qs);
          break;
      }
      return qs;
    }, qParamObject);

    const cfGuidChanged = startingCfGuid !== valueOrCommonFalsy(action.endpointGuid);
    const orgChanged = startingOrgGuid !== valueOrCommonFalsy(qChanges.find((q: QParam) => q.key === 'organization_guid'), {}).value;
    const spaceChanged = startingSpaceGuid !== valueOrCommonFalsy(qChanges.find((q: QParam) => q.key === 'space_guid'), {}).value;

    if (preResetUpdate) {
      preResetUpdate();
    }

    // Changes of org or space will reset pagination and start a new request. Changes of only cf require a punt
    if (cfGuidChanged && !orgChanged && !spaceChanged) {
      store.dispatch(new ResetPagination(action, action.paginationKey));
    } else if (orgChanged || spaceChanged) {
      const newParams = spreadPaginationParams(params);
      newParams.q = qChanges.map(qChange => qChange.toString());
      store.dispatch(new SetParams(action, action.paginationKey, newParams, true, true));
    }
  };
};

interface InitialValues { cf: string; org: string; space: string; }

/**
 * This service relies on OnDestroy, so must be `provided` by a component
 */
@Injectable({
  providedIn: 'root'
})
export class CfOrgSpaceDataService implements OnDestroy {
  private store = inject<Store<CFAppState>>(Store);
  paginationMonitorFactory = inject(PaginationMonitorFactory);


  private static CfOrgSpaceServicePaginationKey = 'endpointOrgSpaceService';

  public cf!: CfOrgSpaceItem<EndpointModel>;
  public org!: CfOrgSpaceItem<IOrganization>;
  public space!: CfOrgSpaceItem<ISpace>;
  public isLoading$: Observable<boolean>;

  // FWT-917: per-instance debug channel. Dev-build-only; prod is a no-op.
  // See cf-org-space-debug.ts and FWT-917 for event-kind vocabulary.
  private debug: CfOrgSpaceDebug = createCfOrgSpaceDebug();

  public paginationAction = this.createOrgPaginationAction();

  /**
   * This will contain all org and space data
   */
  private allOrgs = this.getAllOrgsObservable();

  private allOrgsLoading$ = this.allOrgs.pagination$.pipe(map(
    pag => getCurrentPageRequestInfo(pag).busy
  ));

  private selectMode = CfOrgSpaceSelectMode.FIRST_ONLY;
  private subs: Subscription[] = [];

  // V3-native per-cnsi org store. Keyed by cnsi guid, populated by
  // `GET /pp/v1/cf/orgs/{cnsiGuid}` on cf select. Replaces the v2 ngrx
  // cross-endpoint pagination path that collapsed entities for endpoints
  // sharing api_url and dropped most orgs from the downstream filter.
  private http = inject(HttpClient);
  private _orgsByCnsi = signal<Record<string, { guid: string; name: string }[]>>({});
  private _spacesByOrg = signal<Record<string, { guid: string; name: string }[]>>({});
  private fetchedCnsis = new Set<string>();
  private fetchedOrgKeys = new Set<string>();

  /** Orgs for the currently-selected cnsi. Empty until fetch resolves. */
  public orgList: Signal<{ guid: string; name: string }[]> = computed(() => {
    const cnsi = this.cfSelectSignal();
    if (!cnsi) { return []; }
    return this._orgsByCnsi()[cnsi] ?? [];
  });

  /** Spaces for the currently-selected (cnsi, org). Empty until fetch resolves. */
  public spaceList: Signal<{ guid: string; name: string }[]> = computed(() => {
    const cnsi = this.cfSelectSignal();
    const org = this.orgSelectSignal();
    if (!cnsi || !org) { return []; }
    return this._spacesByOrg()[`${cnsi}:${org}`] ?? [];
  });

  /*
   * Observable that provides initial values for drop downs, output will be parsed through initialValuesMap before emitted on first
   */
  public initialValues$!: Observable<any>;
  /**
   * Map values from `initialValues$` to supply initial values for drop downs
   */
  public initialValuesMap!: (param: any) => InitialValues;

  constructor() {
    this.debug.log('service:construct');
    this.createCf();
    this.createOrg();
    this.createSpace();

    this.isLoading$ = combineLatest(
      this.cf.loading$,
      this.org.loading$,
      this.space.loading$
    ).pipe(
      map(([cfLoading, orgLoading, spaceLoading]) => cfLoading || orgLoading || spaceLoading)
    );

    // V3-native org fetch on cf change. Each cnsi is fetched once;
    // re-selection of an already-fetched cnsi reads the cached signal.
    this.subs.push(this.cf.select.subscribe(cnsi => {
      if (!cnsi || this.fetchedCnsis.has(cnsi)) { return; }
      this.fetchedCnsis.add(cnsi);
      this.http.get<{ resources: { guid: string; name: string }[] }>(
        `/pp/v1/cf/orgs/${cnsi}?per_page=500&page=1`,
      ).pipe(
        catchError(() => EMPTY),
      ).subscribe(resp => {
        this._orgsByCnsi.update(map => ({ ...map, [cnsi]: resp.resources ?? [] }));
      });
    }));

    // V3-native per-org spaces fetch on org change. Each (cnsi,org) is
    // fetched once.
    this.subs.push(this.org.select.subscribe(orgGuid => {
      const cnsi = this.cf.select.getValue();
      if (!cnsi || !orgGuid) { return; }
      const key = `${cnsi}:${orgGuid}`;
      if (this.fetchedOrgKeys.has(key)) { return; }
      this.fetchedOrgKeys.add(key);
      this.http.get<{ resources: { guid: string; name: string }[] }>(
        `/pp/v1/cf/org/${cnsi}/${orgGuid}/spaces?per_page=500&page=1`,
      ).pipe(
        catchError(() => EMPTY),
      ).subscribe(resp => {
        this._spacesByOrg.update(map => ({ ...map, [key]: resp.resources ?? [] }));
      });
    }));

    // Cascade-clear: cf change resets org & space selections.
    let prevCf = this.cf.select.getValue();
    this.subs.push(this.cf.select.subscribe(cnsi => {
      if (cnsi !== prevCf) {
        prevCf = cnsi;
        this.org.select.next(undefined as any);
        this.space.select.next(undefined as any);
      }
    }));

    // Cascade-clear: org change resets space selection.
    let prevOrg = this.org.select.getValue();
    this.subs.push(this.org.select.subscribe(orgGuid => {
      if (orgGuid !== prevOrg) {
        prevOrg = orgGuid;
        this.space.select.next(undefined as any);
      }
    }));

    // Bridge orgList/spaceList signals -> legacy org.list$/space.list$
    // observables. Consumer files reading via `| async` see the V3-sourced
    // data; the old ngrx-pagination-derived list$ chains are replaced.
    this.org.list$ = toObservable(this.orgList) as Observable<IOrganization[]>;
    this.space.list$ = toObservable(this.spaceList) as Observable<ISpace[]>;
  }

  private getAllOrgsObservable() {
    const obs = getPaginationObservables<APIResource<IOrganization>>({
      store: this.store,
      action: this.paginationAction,
      paginationMonitor: this.paginationMonitorFactory.create(
        this.paginationAction.paginationKey,
        cfEntityFactory(this.paginationAction.entityType),
        this.paginationAction.flattenPagination
      )
    }, this.paginationAction.flattenPagination);

    // FWT-917: non-invasive diagnostic tap. The tap sits on a forked
    // entities$ so subscribers to the service see it; pagination$ is
    // unchanged. Critical for diagnosing H2/H5 (pagination race).
    return {
      ...obs,
      entities$: obs.entities$.pipe(
        tap(entities => this.debug.log('allOrgs:entities-emit', {
          count: entities?.length ?? null,
          isNull: entities == null,
          isEmptyArray: Array.isArray(entities) && entities.length === 0,
        })),
      ),
    };
  }

  // Signal-based selection state with BehaviorSubject wrapper for backward compatibility
  private cfSelectSignal = signal<string | null>(null);
  private orgSelectSignal = signal<string | null>(null);
  private spaceSelectSignal = signal<string | null>(null);

  private createCf() {
    const list$ = this.store.select(connectedEndpointsOfTypesSelector(CF_ENDPOINT_TYPE)).pipe(
      // Ensure we have endpoints
      filter(endpoints => endpoints && !!Object.keys(endpoints).length),
      publishReplay(1),
      refCount(),
    );

    // Create BehaviorSubject wrapper that updates signal
    const cfBehaviorSubject = new BehaviorSubject<string | null>(null);
    cfBehaviorSubject.subscribe(value => {
      this.cfSelectSignal.set(value);
      this.debug.log('cf:select-change', { to: value });
    });

    this.cf = {
      list$: list$.pipe(
        // Filter out non-cf endpoints
        map(endpoints => Object.values(endpoints).filter(e => e.cnsi_type === 'cf')),
        // Ensure we have at least one connected cf
        filter(cfs => {
          for (const cf of cfs) {
            if (cf.connectionStatus === 'connected') {
              return true;
            }
          }
          return false;
        }),
        take(1),
        map((endpoints: EndpointModel[]) => {
          return Object.values(endpoints).sort((a: EndpointModel, b: EndpointModel) => naturalCompare(a.name, b.name));
        }),
        tap(endpoints => this.debug.log('cf:list-emit', {
          count: endpoints.length,
          guids: endpoints.map(e => e.guid),
        })),
      ),
      loading$: list$.pipe(
        map(cfs => !cfs)
      ),
      select: cfBehaviorSubject // BehaviorSubject wrapper synced with signal
    };
  }

  private createOrg() {
    const orgList$ = combineLatest(
      this.cf.select.asObservable(),
      this.allOrgs.entities$
    ).pipe(
      map(([selectedCF, entities]) => {
        if (selectedCF && entities) {
          return entities
            .map(org => org.entity)
            .filter(org => org.cfGuid === selectedCF)
            .sort((a, b) => naturalCompare(a.name, b.name));
        }
        return [];
      }),
      tap(orgs => this.debug.log('org:list-emit', { resultCount: orgs.length })),
    );

    // Create BehaviorSubject wrapper that updates signal
    const orgBehaviorSubject = new BehaviorSubject<string | null>(null);
    orgBehaviorSubject.subscribe(value => {
      this.orgSelectSignal.set(value);
      this.debug.log('org:select-change', { to: value });
    });

    this.org = {
      list$: orgList$,
      loading$: this.allOrgsLoading$,
      select: orgBehaviorSubject // BehaviorSubject wrapper synced with signal
    };
  }

  private createSpace() {
    const spaceList$ = combineLatest(
      this.org.select.asObservable(),
      this.allOrgs.entities$
    ).pipe(
      map(([selectedOrgGuid, orgs]) => {
        if (selectedOrgGuid) {
          const selectedOrg = orgs.find(org => org.metadata.guid === selectedOrgGuid);
          if (selectedOrg?.entity?.spaces) {
            return selectedOrg.entity.spaces.map(space => {
              const entity = { ...space.entity };
              entity.guid = space.metadata.guid;
              return entity;
            }).sort((a, b) => naturalCompare(a.name, b.name));
          }
          return [];
        }
        // No org selected ("All"): aggregate spaces from every org, deduplicate by GUID
        // Prefix space name with org name for disambiguation
        const seen = new Set<string>();
        const allSpaces: ISpace[] = [];
        for (const org of orgs) {
          if (org.entity?.spaces) {
            for (const space of org.entity.spaces) {
              if (!seen.has(space.metadata.guid)) {
                seen.add(space.metadata.guid);
                const entity = { ...space.entity };
                entity.guid = space.metadata.guid;
                entity.name = `${space.entity.name} (${org.entity.name})`;
                allSpaces.push(entity);
              }
            }
          }
        }
        return allSpaces.sort((a, b) => naturalCompare(a.name, b.name));
      }),
      tap(spaces => this.debug.log('space:list-emit', { resultCount: spaces.length })),
    );

    // Create BehaviorSubject wrapper that updates signal
    const spaceBehaviorSubject = new BehaviorSubject<string | null>(null);
    spaceBehaviorSubject.subscribe(value => {
      this.spaceSelectSignal.set(value);
      this.debug.log('space:select-change', { to: value });
    });

    this.space = {
      list$: spaceList$,
      loading$: this.org.loading$,
      select: spaceBehaviorSubject // BehaviorSubject wrapper synced with signal
    };
  }

  private createOrgPaginationAction() {
    return cfEntityCatalog.org.actions.getMultiple(null, CfOrgSpaceDataService.CfOrgSpaceServicePaginationKey, {
      includeRelations: [
        createEntityRelationKey(organizationEntityType, spaceEntityType),
      ],
      populateMissing: true
    });
  }

  public getEndpointOrgs(endpointGuid: string) {
    return this.allOrgs.entities$.pipe(
      map(orgs => {
        return orgs.filter(o => o.entity.cfGuid === endpointGuid);
      })
    );
  }

  public setInitialValuesFromAction(
    paginatedAction: PaginatedAction,
    cfKey: string,
    orgKey: string,
    spaceKey: string,
  ) {
    this.initialValuesMap = (p: PaginationEntityState) => ({
      cf: p.clientPagination?.filter?.items[cfKey],
      org: p.clientPagination?.filter?.items[orgKey],
      space: p.clientPagination?.filter?.items[spaceKey]
    });
    this.initialValues$ = this.paginationMonitorFactory.create(
      paginatedAction.paginationKey,
      cfEntityFactory(paginatedAction.entityType),
      paginatedAction.flattenPagination
    ).pagination$.pipe(
      filter(p => !!p?.clientPagination?.filter),
    );

    // Sync BehaviorSubjects with persisted store values so
    // dropdowns and list filtering are consistent from first render
    this.initialValues$.pipe(
      take(1),
      map(this.initialValuesMap),
    ).subscribe(values => {
      this.debug.log('initialValues:resolved', values);
      if (values.cf) { this.selectSet(this.cf.select, values.cf); }
      if (values.org) { this.selectSet(this.org.select, values.org); }
      if (values.space) { this.selectSet(this.space.select, values.space); }
    });
  }

  private getInitialValues(): Observable<InitialValues> {
    const initialValues$ = this.initialValues$ || of({ cf: undefined, org: undefined, space: undefined });
    const defaultMap = (a: any) => a;
    const initialValuesMap = this.initialValuesMap || defaultMap;
    return initialValues$.pipe(
      take(1),
      map(initialValuesMap) // Map needs to happen at the point the auto selectors are enabled
    );
  }

  public enableAutoSelectors() {
    combineLatest(
      // Start watching the cf/org/space plus automatically setting values only when we actually have values to auto select
      this.org.list$,
      // Get initial values only after we've given a prod... so first values emitted are the one's we want
      this.getInitialValues(),
    ).pipe(take(1)).subscribe(([, initialValues]) => {
      this.setupAutoSelectors(initialValues.cf, initialValues.org);
    });
  }

  private setupAutoSelectors(initialCf: string, initialOrg: string) {
    this.debug.log('autoSelector:setup', { initialCf, initialOrg });

    // Clear or automatically select org + space given cf
    let cfTapped = false;
    const orgResetSub = this.cf.select.asObservable().pipe(
      startWith(initialCf),
      distinctUntilChanged(),
      // FWT-917 H3 diagnostic: log every candidate BEFORE the filter so we
      // can see when the filter swallows a happy-path emission (cf ===
      // initialCf on first arrival, cfTapped still false → willFire false).
      tap(cf => this.debug.log('autoSelector:cf-pre-filter', {
        cf, initialCf, cfTapped,
        willFire: cfTapped || cf !== initialCf,
      })),
      filter(cf => cfTapped || cf !== initialCf),
      // FWT-917 H2 fix: previously `withLatestFrom(this.org.list$)` grabbed
      // org.list$ at the exact instant cf.select fired, which on a cold
      // cache returned [] because the orgs paginated fetch was still in
      // flight. The cascade then cleared org.select to undefined, which
      // never recovered because cf.select doesn't re-fire when the fetch
      // completes. Now we wait for the pagination state to show a
      // completed (non-busy, attempted-at-least-once) request, then read
      // a fresh org.list$ snapshot with real data.
      switchMap(selectedCF => this.waitForOrgsReady$.pipe(
        tap(() => this.debug.log('autoSelector:cf-cascade-ready', { selectedCF })),
        switchMap(() => this.org.list$.pipe(take(1))),
        map(orgs => [selectedCF, orgs] as const),
      )),
      tap(([_selectedCF, orgs]) => {
        cfTapped = true;
        const willAutoPick = !!orgs.length &&
          ((this.selectMode === CfOrgSpaceSelectMode.FIRST_ONLY && orgs.length === 1) ||
            (this.selectMode === CfOrgSpaceSelectMode.ANY));
        this.debug.log('autoSelector:cf-cascade-fire', {
          orgCount: orgs.length,
          willAutoPick,
          picked: willAutoPick ? orgs[0].guid : null,
        });
        if (willAutoPick) {
          this.selectSet(this.org.select, orgs[0].guid);
        } else {
          this.selectSet(this.org.select, undefined);
          this.selectSet(this.space.select, undefined);
        }
      }),
    ).subscribe();
    this.subs.push(orgResetSub);

    // Clear or automatically select space given org
    let orgTapped = false;
    const spaceResetSub = this.org.select.asObservable().pipe(
      startWith(initialOrg),
      distinctUntilChanged(),
      tap(org => this.debug.log('autoSelector:org-pre-filter', {
        org, initialOrg, orgTapped,
        willFire: orgTapped || org !== initialOrg,
      })),
      filter(org => orgTapped || org !== initialOrg),
      // FWT-917 H2 fix: same pattern as the cf cascade. Spaces come back
      // embedded in the orgs pagination (via includeRelations), so the
      // same "wait for orgs fetch to complete" gate applies — the space
      // list is only meaningful once the orgs fetch has finished.
      switchMap(selectedOrg => this.waitForOrgsReady$.pipe(
        tap(() => this.debug.log('autoSelector:org-cascade-ready', { selectedOrg })),
        switchMap(() => this.space.list$.pipe(take(1))),
        map(spaces => [selectedOrg, spaces] as const),
      )),
      tap(([_selectedOrg, spaces]) => {
        orgTapped = true;
        const willAutoPick = !!spaces.length &&
          ((this.selectMode === CfOrgSpaceSelectMode.FIRST_ONLY && spaces.length === 1) ||
            (this.selectMode === CfOrgSpaceSelectMode.ANY));
        this.debug.log('autoSelector:org-cascade-fire', {
          spaceCount: spaces.length,
          willAutoPick,
          picked: willAutoPick ? spaces[0].guid : null,
        });
        if (willAutoPick) {
          this.selectSet(this.space.select, spaces[0].guid);
        } else {
          this.selectSet(this.space.select, undefined);
        }
      })
    ).subscribe();
    this.subs.push(spaceResetSub);
  }

  /**
   * FWT-917: Emits once the orgs paginated fetch has transitioned into a
   * "completed" state — i.e. the current pageRequest entry exists (so the
   * fetch was actually attempted) AND is not currently busy. This is the
   * gate the auto-selector cascades wait on before reading org/space lists,
   * so they see real data instead of an empty array from a still-in-flight
   * initial load.
   *
   * Subscribes to `allOrgs.entities$` as a side-effect to guarantee the
   * fetch is triggered (a no-op join if the fetch is already in flight or
   * completed). Without this trigger, the cascade could deadlock if no
   * other consumer has subscribed yet.
   */
  private waitForOrgsReady$ = defer(() => {
    // Trigger the underlying fetch by subscribing to entities$ — fire-and-
    // forget because we only care about the side effect.
    this.allOrgs.entities$.pipe(take(1)).subscribe();
    return this.allOrgs.pagination$.pipe(
      filter(pag => {
        const req = pag?.pageRequests?.[pag?.currentPage];
        return !!req && !req.busy;
      }),
      take(1),
    );
  });

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
