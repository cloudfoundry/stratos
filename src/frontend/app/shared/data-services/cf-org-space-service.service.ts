import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { GetAllOrganizations, OrganizationSchema } from '../../store/actions/organization.actions';
import { AppState } from '../../store/app-state';
import { getPaginationObservables, getCurrentPageRequestInfo } from '../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { endpointsRegisteredEntitiesSelector } from '../../store/selectors/endpoint.selectors';
import { EndpointModel } from '../../store/types/endpoint.types';

export interface CfOrgSpaceItem {
  list$: Observable<EndpointModel[] | any[]>;
  loading$: Observable<boolean>;
  select: BehaviorSubject<EndpointModel | any>;
}

@Injectable()
export class CfOrgSpaceDataService {

  private static CfOrgSpaceServicePaginationKey = 'endpointOrgSpaceService';

  public cf: CfOrgSpaceItem;
  public org: CfOrgSpaceItem;
  public space: CfOrgSpaceItem;

  public paginationAction = new GetAllOrganizations(CfOrgSpaceDataService.CfOrgSpaceServicePaginationKey);

  // TODO: We should optimise this to only fetch the orgs for the current endpoint
  // (if we inline depth the get orgs request it could be hefty... or we could use a different action to only fetch required data..
  // which might mean inline data missing from entity when we need it)
  private allOrgs$ = getPaginationObservables({
    store: this.store,
    action: this.paginationAction,
    schema: [OrganizationSchema]
  });

  private getEndpointsAndOrgs$: Observable<any>;

  constructor(private store: Store<AppState>) {
    this.createCf();
    this.init();
    this.createOrg();
    this.createSpace();

    const orgResetSub = this.cf.select.asObservable().distinctUntilChanged().do(() => {
      // When this service is refactored we need to update these at the same time as the cf select change occurs
      this.org.select.next(undefined);
      this.space.select.next(undefined);
    }).subscribe();
    this.cf.select.asObservable().finally(() => {
      orgResetSub.unsubscribe();
    });

    const spaceResetSub = this.org.select.asObservable().distinctUntilChanged().do(() => {
      // When this service is refactored we need to update these at the same time as the cf select change occurs
      this.space.select.next(undefined);
    }).subscribe();
    this.org.select.asObservable().finally(() => {
      spaceResetSub.unsubscribe();
    });

  }

  private init() {
    this.getEndpointsAndOrgs$ = Observable.combineLatest(
      this.allOrgs$.pagination$.filter(paginationEntity => {
        return !getCurrentPageRequestInfo(paginationEntity).busy;
      }).first(),
      this.cf.list$
    );
  }

  private createCf() {
    this.cf = {
      list$: this.store.select(endpointsRegisteredEntitiesSelector).first().map(endpoints => Object.values(endpoints)),
      loading$: Observable.of(false),
      select: new BehaviorSubject(undefined),
    };
  }

  private createOrg() {
    const orgList$ = Observable.combineLatest(
      this.cf.select.asObservable(),
      this.getEndpointsAndOrgs$,
      this.allOrgs$.entities$
    )
      .map(([selectedCF, endpointsAndOrgs, entities]: [EndpointModel, any, any]) => {
        const [pag, cfList] = endpointsAndOrgs;
        if (selectedCF && entities) {
          return entities.map(org => org.entity).filter(org => org.cfGuid === selectedCF);
        }
        return [];
      });

    this.org = {
      list$: orgList$,
      loading$: this.allOrgs$.pagination$.map(pag => getCurrentPageRequestInfo(pag).busy),
      select: new BehaviorSubject(undefined),
    };
  }

  private createSpace() {
    const spaceList$ = Observable.combineLatest(
      this.org.select.asObservable(),
      this.getEndpointsAndOrgs$,
      this.allOrgs$.entities$
    )
      .map(([selectedOrgGuid, data, orgs]) => {
        const [orgList, cfList] = data;
        const selectedOrg = orgs.find(org => {
          return org.entity.guid === selectedOrgGuid;
        });
        if (selectedOrg && selectedOrg.entity && selectedOrg.entity.spaces) {
          return selectedOrg.entity.spaces.map(space => {
            const entity = { ...space.entity };
            entity.guid = space.metadata.guid;
            return entity;
          });
        }
        return [];
      });

    this.space = {
      list$: spaceList$,
      loading$: this.org.loading$,
      select: new BehaviorSubject(undefined),
    };
  }
}
