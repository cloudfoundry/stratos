import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { IHeaderBreadcrumb } from '../../../../../core/src/shared/components/page-header/page-header.types';
import { AppState } from '../../../../../store/src/app-state';
import { endpointEntitiesSelector } from '../../../../../store/src/selectors/endpoint.selectors';
import { APIResource } from '../../../../../store/src/types/api.types';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { IOrganization, IOrgQuotaDefinition, ISpace, ISpaceQuotaDefinition } from '../../../cf-api.types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';

export class QuotaDefinitionBaseComponent {
  breadcrumbs$: Observable<IHeaderBreadcrumb[]>;
  quotaDefinition$: Observable<APIResource<IOrgQuotaDefinition | ISpaceQuotaDefinition>>;
  org$: Observable<APIResource<IOrganization>>;
  space$: Observable<APIResource<ISpace>>;
  cfGuid: string;
  orgGuid: string;
  spaceGuid: string;
  quotaGuid: string;
  detailsLoading$: Observable<boolean>;
  orgSubscriber: Subscription;

  constructor(
    protected store: Store<AppState>,
    protected activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    protected activatedRoute: ActivatedRoute,
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid || activatedRoute.snapshot.queryParams.cfGuid;
    this.orgGuid = activeRouteCfOrgSpace.orgGuid || activatedRoute.snapshot.queryParams.orgGuid;
    this.spaceGuid = activeRouteCfOrgSpace.spaceGuid || activatedRoute.snapshot.queryParams.spaceGuid;
    this.quotaGuid = activatedRoute.snapshot.params.quotaId || activatedRoute.snapshot.queryParams.quotaGuid;
    this.setupOrgObservable();
    this.setupSpaceObservable();
    this.setupBreadcrumbs();
  }

  setupOrgObservable() {
    if (this.orgGuid) {
      this.org$ = cfEntityCatalog.org.store.getEntityService(this.orgGuid, this.cfGuid).waitForEntity$.pipe(
        map(data => data.entity),
      );
    }
  }

  setupSpaceObservable() {
    if (this.spaceGuid) {
      this.space$ = cfEntityCatalog.space.store.getEntityService(this.spaceGuid, this.cfGuid).waitForEntity$.pipe(
        map(data => data.entity),
      );
    }
  }

  private setupBreadcrumbs() {
    const endpoints$ = this.store.select(endpointEntitiesSelector);
    const org$ = this.org$ ? this.org$ : of(null);
    const space$ = this.space$ ? this.space$ : of(null);
    this.breadcrumbs$ = combineLatest(endpoints$, org$, space$).pipe(
      map(([endpoints, org, space]) => this.getBreadcrumbs(endpoints[this.cfGuid], org, space)),
      first()
    );
  }

  protected setupQuotaDefinitionObservable() {
    throw new Error('Method not implemented.');
  }

  protected getBreadcrumbs(
    endpoint: EndpointModel,
    org: APIResource<IOrganization>,
    space: APIResource<ISpace>
  ) {
    return null;
  }
}
