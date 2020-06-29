import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest as observableCombineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import { map, publishReplay, refCount, switchMap, tap } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { organizationEntityType } from '../../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { truthyIncludingZeroString } from '../../../../../../../../core/src/core/utils.service';
import { ConfirmationDialogConfig } from '../../../../../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { CardCell } from '../../../../../../../../core/src/shared/components/list/list.types';
import { RouterNav } from '../../../../../../../../store/src/actions/router.actions';
import { FavoritesConfigMapper } from '../../../../../../../../store/src/favorite-config-mapper';
import { EntityMonitorFactory } from '../../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../../../store/src/monitors/pagination-monitor.factory';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { EndpointUser } from '../../../../../../../../store/src/types/endpoint.types';
import { MenuItem } from '../../../../../../../../store/src/types/menu-item.types';
import { ComponentEntityMonitorConfig, StratosStatus } from '../../../../../../../../store/src/types/shared.types';
import { IFavoriteMetadata, UserFavorite } from '../../../../../../../../store/src/types/user-favorites.types';
import { getFavoriteFromEntity } from '../../../../../../../../store/src/user-favorite-helpers';
import { IApp, IOrganization } from '../../../../../../cf-api.types';
import { cfEntityFactory } from '../../../../../../cf-entity-factory';
import { getStartedAppInstanceCount } from '../../../../../../cf.helpers';
import { getOrgRolesString } from '../../../../../../features/cloud-foundry/cf.helpers';
import {
  CloudFoundryEndpointService,
} from '../../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { OrgQuotaHelper } from '../../../../../../features/cloud-foundry/services/cloud-foundry-organization-quota';
import {
  createOrgQuotaDefinition,
} from '../../../../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { createUserRoleInOrg } from '../../../../../../store/types/cf-user.types';
import { CfCurrentUserPermissions } from '../../../../../../user-permissions/cf-user-permissions-checkers';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { CF_ENDPOINT_TYPE } from './../../../../../../cf-types';


@Component({
  selector: 'app-cf-org-card',
  templateUrl: './cf-org-card.component.html',
  styleUrls: ['./cf-org-card.component.scss']
})
export class CfOrgCardComponent extends CardCell<APIResource<IOrganization>> implements OnInit, OnDestroy {
  cardMenu: MenuItem[];
  orgGuid: string;
  normalisedMemoryUsage: number;
  memoryLimit: string;
  instancesLimit: string;
  subscriptions: Subscription[] = [];
  memoryTotal: number;
  instancesCount: number;
  appCount$: Observable<number>;
  userRolesInOrg: string;
  currentUser$: Observable<EndpointUser>;
  public entityConfig: ComponentEntityMonitorConfig;
  public favorite: UserFavorite<IFavoriteMetadata>;
  public orgStatus$: Observable<StratosStatus>;

  constructor(
    private cfUserService: CfUserService,
    public cfEndpointService: CloudFoundryEndpointService,
    private store: Store<CFAppState>,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    private confirmDialog: ConfirmationDialogService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private emf: EntityMonitorFactory,
    private favoritesConfigMapper: FavoritesConfigMapper
  ) {
    super();

    this.cardMenu = [
      {
        label: 'Edit',
        action: this.edit,
        can: this.currentUserPermissionsService.can(CfCurrentUserPermissions.ORGANIZATION_EDIT, this.cfEndpointService.cfGuid)
      },
      {
        label: 'Delete',
        action: this.delete,
        can: this.currentUserPermissionsService.can(CfCurrentUserPermissions.ORGANIZATION_DELETE, this.cfEndpointService.cfGuid)
      }
    ];
  }

  ngOnInit() {
    const userRole$ = this.cfEndpointService.currentUser$.pipe(
      switchMap(u => {
        // This is null if the endpoint is disconnected. Probably related to https://github.com/cloudfoundry-incubator/stratos/issues/1727
        if (!u) {
          return observableOf(createUserRoleInOrg(false, false, false, false));
        }
        return this.cfUserService.getUserRoleInOrg(u.guid, this.row.metadata.guid, this.row.entity.cfGuid);
      }),
      map(u => getOrgRolesString(u)),
      publishReplay(1),
      refCount()
    );

    this.favorite = getFavoriteFromEntity(this.row, organizationEntityType, this.favoritesConfigMapper, CF_ENDPOINT_TYPE);

    const allApps$: Observable<APIResource<IApp>[]> = this.cfEndpointService.appsPagObs.hasEntities$.pipe(
      switchMap(hasAll => hasAll ? this.cfEndpointService.getAppsInOrgViaAllApps(this.row) : observableOf(null))
    );

    this.appCount$ = allApps$.pipe(
      switchMap(allApps => allApps ? observableOf(allApps.length) : CloudFoundryEndpointService.fetchAppCount(
        this.store,
        this.paginationMonitorFactory,
        this.cfEndpointService.cfGuid,
        this.row.metadata.guid
      ))
    );

    const fetchData$ = observableCombineLatest(
      userRole$,
      allApps$
    ).pipe(
      tap(([role, apps]) => {
        this.setValues(role, apps);
      })
    );

    this.subscriptions.push(fetchData$.subscribe());
    this.orgGuid = this.row.metadata.guid;
    this.entityConfig = new ComponentEntityMonitorConfig(this.orgGuid, cfEntityFactory(organizationEntityType));

    const orgQuotaHelper = new OrgQuotaHelper(this.cfEndpointService, this.emf, this.orgGuid);
    this.orgStatus$ = orgQuotaHelper.createStateObs();
  }

  setAppsDependentCounts = (apps: APIResource<IApp>[]) => {
    this.instancesCount = getStartedAppInstanceCount(apps);
  }

  setValues = (role: string, apps: APIResource<IApp>[]) => {
    this.userRolesInOrg = role;
    const quotaDefinition = this.row.entity.quota_definition || { entity: createOrgQuotaDefinition(), metadata: null };

    if (apps) {
      this.setAppsDependentCounts(apps);
      this.memoryTotal = this.cfEndpointService.getMetricFromApps(apps, 'memory');
      this.normalisedMemoryUsage = this.memoryTotal / quotaDefinition.entity.memory_limit * 100;
    }

    this.instancesLimit = truthyIncludingZeroString(quotaDefinition.entity.app_instance_limit);
    this.memoryLimit = truthyIncludingZeroString(quotaDefinition.entity.memory_limit);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(p => p.unsubscribe());
  }

  edit = () => {
    this.store.dispatch(
      new RouterNav({
        path: ['cloud-foundry', this.cfEndpointService.cfGuid, 'organizations', this.orgGuid, 'edit-org']
      })
    );
  }

  delete = () => {
    const confirmation = new ConfirmationDialogConfig(
      'Delete Organization',
      {
        textToMatch: this.row.entity.name
      },
      'Delete',
      true,
    );
    this.confirmDialog.open(confirmation, () => {
      this.cfEndpointService.deleteOrg(
        this.row.metadata.guid,
        this.cfEndpointService.cfGuid
      );
    });
  }

  goToSummary = () => this.store.dispatch(new RouterNav({
    path: ['cloud-foundry', this.cfEndpointService.cfGuid, 'organizations', this.orgGuid]
  }))
}
