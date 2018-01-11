import { EntityInfo } from '../../store/types/api.types';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { cnsisRegisteredEntitiesSelector } from '../../store/selectors/cnsis.selectors';
import { getPaginationObservables } from '../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { GetAllOrganizations, OrganizationSchema } from '../../store/actions/organization.actions';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CNSISModel } from '../../store/types/cnsis.types';

export interface CfOrgSpaceItem {
  list$: Observable<CNSISModel[] | any[]>;
  loading$: Observable<boolean>;
  select: BehaviorSubject<CNSISModel | any>;
}

@Injectable()
export class CfOrgSpaceServiceService {

  private static CfOrgSpaceServicePaginationKey = 'endpointOrgSpaceService';

  public cf: CfOrgSpaceItem;
  public org: CfOrgSpaceItem;
  public space: CfOrgSpaceItem;

  // TODO: We should optimise this to only fetch the orgs for the current endpoint
  // (if we inline depth the get orgs request it could be hefty... or we could use a different action to only fetch required data..
  // which might mean inline data missing from entity when we need it)
  private allOrgs$ = getPaginationObservables({
    store: this.store,
    action: new GetAllOrganizations(CfOrgSpaceServiceService.CfOrgSpaceServicePaginationKey),
    schema: [OrganizationSchema]
  });

  constructor(private store: Store<AppState>) {
    this.cf = {
      list$: this.store.select(cnsisRegisteredEntitiesSelector).first().map(cnsis => Object.values(cnsis)),
      loading$: Observable.of(false),
      select: new BehaviorSubject(null),
    };

    const getEndpointsAndOrgs$ = Observable.combineLatest(
      this.allOrgs$.pagination$.filter(paginationEntity => {
        return !paginationEntity.fetching;
      }).first(),
      this.cf.list$
    );

    const orgList$ = Observable.combineLatest(
      this.cf.select.asObservable(),
      getEndpointsAndOrgs$,
      this.allOrgs$.entities$
    )
      .do(() => this.org.select.next(null))
      .map(([selectedCF, endpointsAndOrgs, entities]: [CNSISModel, any, any]) => {
        const [pag, cfList] = endpointsAndOrgs;
        if (selectedCF) {
          if (entities) {
            return entities
              .map(org => org.entity)
              .filter(org => {
                return org.cfGuid === selectedCF.guid;
              });
          }
        }
        return [];
      });

    this.org = {
      list$: orgList$,
      loading$: this.allOrgs$.pagination$.map(pag => pag.fetching),
      select: new BehaviorSubject(null),
    };

    const spaceList$ = Observable.combineLatest(
      this.org.select.asObservable(),
      getEndpointsAndOrgs$
    )
      .do(() => this.space.select.next(null))
      .map(([selectedOrg, data]) => {
        const [orgList, cfList] = data;
        if (selectedOrg) {
          return selectedOrg.spaces.map(space => {
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
      select: new BehaviorSubject(null),
    };
  }
}
