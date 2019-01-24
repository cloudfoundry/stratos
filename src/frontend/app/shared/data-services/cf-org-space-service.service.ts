import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  first,
  map,
  publishReplay,
  refCount,
  startWith,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import { IOrganization, ISpace } from '../../core/cf-api.types';
import { GetAllOrganizations } from '../../store/actions/organization.actions';
import { ResetPagination, SetParams } from '../../store/actions/pagination.actions';
import { AppState } from '../../store/app-state';
import { entityFactory, organizationSchemaKey, spaceSchemaKey } from '../../store/helpers/entity-factory';
import { createEntityRelationKey } from '../../store/helpers/entity-relations/entity-relations.types';
import {
  getCurrentPageRequestInfo,
  getPaginationObservables,
  spreadPaginationParams,
} from '../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { endpointsRegisteredEntitiesSelector } from '../../store/selectors/endpoint.selectors';
import { selectPaginationState } from '../../store/selectors/pagination.selectors';
import { APIResource } from '../../store/types/api.types';
import { EndpointModel } from '../../store/types/endpoint.types';
import { PaginatedAction, PaginationParam, QParam } from '../../store/types/pagination.types';
import { ListPaginationMultiFilterChange } from '../components/list/data-sources-controllers/list-data-source-types';
import { valueOrCommonFalsy } from '../components/list/data-sources-controllers/list-pagination-controller';
import { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';

export function createCfOrgSpaceFilterConfig(key: string, label: string, cfOrgSpaceItem: CfOrgSpaceItem) {
  return {
    key: key,
    label: label,
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


export const initCfOrgSpaceService = (store: Store<AppState>,
  cfOrgSpaceService: CfOrgSpaceDataService,
  schemaKey: string,
  paginationKey: string): Observable<any> => {
  return store.select(selectPaginationState(schemaKey, paginationKey)).pipe(
    filter((pag) => !!pag),
    first(),
    tap(pag => {
      const { cf, org, space } = pag.clientPagination.filter.items;
      if (cf) {
        cfOrgSpaceService.cf.select.next(cf);
      }
      if (org) {
        cfOrgSpaceService.org.select.next(org);
      }
      if (space) {
        cfOrgSpaceService.space.select.next(space);
      }
    })
  );
};

export const createCfOrSpaceMultipleFilterFn = (
  store: Store<AppState>,
  action: PaginatedAction,
  setQParam: (setQ: QParam, qs: QParam[]) => boolean) => {
  return (changes: ListPaginationMultiFilterChange[], params: PaginationParam) => {
    if (!changes.length) {
      return;
    }

    const startingCfGuid = valueOrCommonFalsy(action.endpointGuid);
    const startingOrgGuid = valueOrCommonFalsy(params.q.find((q: QParam) => q.key === 'organization_guid'), {}).value;
    const startingSpaceGuid = valueOrCommonFalsy(params.q.find((q: QParam) => q.key === 'space_guid'), {}).value;

    const qChanges = changes.reduce((qs: QParam[], change) => {
      switch (change.key) {
        case 'cf':
          action.endpointGuid = change.value;
          setQParam(new QParam('organization_guid', '', ' IN '), qs);
          setQParam(new QParam('space_guid', '', ' IN '), qs);
          break;
        case 'org':
          setQParam(new QParam('organization_guid', change.value, ' IN '), qs);
          break;
        case 'space':
          setQParam(new QParam('space_guid', change.value, ' IN '), qs);
          break;
      }
      return qs;
    }, spreadPaginationParams(params).q || []);

    const cfGuidChanged = startingCfGuid !== valueOrCommonFalsy(action.endpointGuid);
    const orgChanged = startingOrgGuid !== valueOrCommonFalsy(qChanges.find((q: QParam) => q.key === 'organization_guid'), {}).value;
    const spaceChanged = startingSpaceGuid !== valueOrCommonFalsy(qChanges.find((q: QParam) => q.key === 'space_guid'), {}).value;

    // Changes of org or space will reset pagination and start a new request. Changes of only cf require a punt
    if (cfGuidChanged && !orgChanged && !spaceChanged) {
      store.dispatch(new ResetPagination(action.entityKey, action.paginationKey));
    } else if (orgChanged || spaceChanged) {
      const newParams = spreadPaginationParams(params);
      newParams.q = qChanges;
      store.dispatch(new SetParams(action.entityKey, action.paginationKey, newParams, true, true));
    }
  };
};


@Injectable()
export class CfOrgSpaceDataService implements OnDestroy {
  private static CfOrgSpaceServicePaginationKey = 'endpointOrgSpaceService';

  public cf: CfOrgSpaceItem<EndpointModel>;
  public org: CfOrgSpaceItem<IOrganization>;
  public space: CfOrgSpaceItem<ISpace>;
  public isLoading$: Observable<boolean>;

  public paginationAction = new GetAllOrganizations(CfOrgSpaceDataService.CfOrgSpaceServicePaginationKey, null, [
    createEntityRelationKey(organizationSchemaKey, spaceSchemaKey),
  ]);

  /**
   * This will contain all org and space data
   */
  private allOrgs = getPaginationObservables<APIResource<IOrganization>>({
    store: this.store,
    action: this.paginationAction,
    paginationMonitor: this.paginationMonitorFactory.create(
      this.paginationAction.paginationKey,
      entityFactory(this.paginationAction.entityKey)
    )
  });
  private allOrgsLoading$ = this.allOrgs.pagination$.pipe(map(
    pag => getCurrentPageRequestInfo(pag).busy
  ));

  private getEndpointsAndOrgs$: Observable<any>;
  private selectMode = CfOrgSpaceSelectMode.FIRST_ONLY;
  private subs: Subscription[] = [];

  constructor(
    private store: Store<AppState>,
    public paginationMonitorFactory: PaginationMonitorFactory,
  ) {
    this.createCf();
    this.init();
    this.createOrg();
    this.createSpace();

    // Start watching the cf/org/space plus automatically setting values only when we actually have values to auto select
    this.org.list$.pipe(
      first(),
    ).subscribe(null, null, () => {
      this.setupAutoSelectors();
    });

    this.isLoading$ = combineLatest(
      this.cf.loading$,
      this.org.loading$,
      this.space.loading$
    ).pipe(
      map(([cfLoading, orgLoading, spaceLoading]) => cfLoading || orgLoading || spaceLoading)
    );

  }

  private init() {
    const orgs = this.allOrgs.pagination$.pipe(
      filter(paginationEntity => {
        return !getCurrentPageRequestInfo(paginationEntity).busy;
      }),
      first()
    );
    this.getEndpointsAndOrgs$ = this.cf.list$.pipe(
      switchMap(endpoints => {
        return combineLatest(
          observableOf(endpoints),
          orgs
        );
      })
    );
  }

  private createCf() {
    const list$ = this.store.select(endpointsRegisteredEntitiesSelector).pipe(
      // Ensure we have endpoints
      filter(endpoints => endpoints && !!Object.keys(endpoints).length),
      publishReplay(1),
      refCount(),
    );
    this.cf = {
      list$: list$.pipe(
        // Filter out non-cf endpoints
        map(endpoints => Object.values(endpoints).filter(e => e.cnsi_type === 'cf')),
        // Ensure we have at least one connected cf
        filter(cfs => {
          for (let i = 0; i < cfs.length; i++) {
            if (cfs[i].connectionStatus === 'connected') {
              return true;
            }
          }
          return false;
        }),
        first(),
        map((endpoints: EndpointModel[]) => {
          return Object.values(endpoints).sort((a: EndpointModel, b: EndpointModel) => a.name.localeCompare(b.name));
        }),
      ),
      loading$: list$.pipe(
        map(cfs => !cfs)
      ),
      select: new BehaviorSubject(undefined)
    };
  }

  private createOrg() {
    const orgList$ = this.getEndpointsAndOrgs$.pipe(
      switchMap(endpoints => {
        return combineLatest(
          this.cf.select.asObservable(),
          observableOf(endpoints),
          this.allOrgs.entities$
        );
      }),
      map(
        ([selectedCF, endpointsAndOrgs, entities]: [string, any, APIResource<IOrganization>[]]) => {
          const [pag, cfList] = endpointsAndOrgs;
          if (selectedCF && entities) {
            return entities
              .map(org => org.entity)
              .filter(org => org.cfGuid === selectedCF)
              .sort((a, b) => a.name.localeCompare(b.name));
          }
          return [];
        }
      )
    );

    this.org = {
      list$: orgList$,
      loading$: this.allOrgsLoading$,
      select: new BehaviorSubject(undefined)
    };
  }

  private createSpace() {
    const spaceList$ = this.getEndpointsAndOrgs$.pipe(
      switchMap(endpoints => {
        return combineLatest(
          this.org.select.asObservable(),
          observableOf(endpoints),
          this.allOrgs.entities$
        );
      }),
      map(([selectedOrgGuid, data, orgs]) => {
        const [orgList, cfList] = data;
        const selectedOrg = orgs.find(org => {
          return org.metadata.guid === selectedOrgGuid;
        });
        if (selectedOrg && selectedOrg.entity && selectedOrg.entity.spaces) {
          return selectedOrg.entity.spaces.map(space => {
            const entity = { ...space.entity };
            entity.guid = space.metadata.guid;
            return entity;
          }).sort((a, b) => a.name.localeCompare(b.name));
        }
        return [];
      })
    );

    this.space = {
      list$: spaceList$,
      loading$: this.org.loading$,
      select: new BehaviorSubject(undefined)
    };
  }

  public getEndpointOrgs(endpointGuid: string) {
    return this.allOrgs.entities$.pipe(
      map(orgs => {
        return orgs.filter(o => o.entity.cfGuid === endpointGuid);
      })
    );
  }

  private setupAutoSelectors() {
    const orgResetSub = this.cf.select.asObservable().pipe(
      startWith(undefined),
      distinctUntilChanged(),
      withLatestFrom(this.org.list$),
      tap(([selectedCF, orgs]) => {
        if (
          !!orgs.length &&
          ((this.selectMode === CfOrgSpaceSelectMode.FIRST_ONLY && orgs.length === 1) ||
            (this.selectMode === CfOrgSpaceSelectMode.ANY))
        ) {
          this.selectSet(this.org.select, orgs[0].guid);
        } else {
          this.selectSet(this.org.select, undefined);
          this.selectSet(this.space.select, undefined);
        }
      }),
    ).subscribe();
    this.subs.push(orgResetSub);

    // Clear or automatically select space given org
    const spaceResetSub = this.org.select.asObservable().pipe(
      startWith(undefined),
      distinctUntilChanged(),
      withLatestFrom(this.space.list$),
      tap(([selectedOrg, spaces]) => {
        if (
          !!spaces.length &&
          ((this.selectMode === CfOrgSpaceSelectMode.FIRST_ONLY && spaces.length === 1) ||
            (this.selectMode === CfOrgSpaceSelectMode.ANY))
        ) {
          this.selectSet(this.space.select, spaces[0].guid);
        } else {
          this.selectSet(this.space.select, undefined);
        }
      })
    ).subscribe();
    this.subs.push(spaceResetSub);
  }

  private selectSet(select: BehaviorSubject<string>, newValue: string) {
    if (select.getValue() !== newValue) {
      select.next(newValue);
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
