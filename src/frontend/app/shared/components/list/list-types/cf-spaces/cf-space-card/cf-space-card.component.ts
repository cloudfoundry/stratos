import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest as observableCombineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

import { IApp, ISpace } from '../../../../../../core/cf-api.types';
import { getStartedAppInstanceCount } from '../../../../../../core/cf.helpers';
import { CurrentUserPermissions } from '../../../../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../core/current-user-permissions.service';
import { truthyIncludingZeroString } from '../../../../../../core/utils.service';
import { getSpaceRolesString } from '../../../../../../features/cloud-foundry/cf.helpers';
import {
  CloudFoundryEndpointService,
} from '../../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import {
  CloudFoundryOrganizationService,
  createQuotaDefinition,
} from '../../../../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { SpaceQuotaHelper } from '../../../../../../features/cloud-foundry/services/cloud-foundry-space-quota';
import { RouterNav } from '../../../../../../store/actions/router.actions';
import { AppState } from '../../../../../../store/app-state';
import { entityFactory, spaceSchemaKey } from '../../../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../../../store/types/api.types';
import { EndpointUser } from '../../../../../../store/types/endpoint.types';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../monitors/pagination-monitor.factory';
import { CardStatus, ComponentEntityMonitorConfig } from '../../../../../shared.types';
import { ConfirmationDialogConfig } from '../../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../confirmation-dialog.service';
import { MetaCardMenuItem } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { CardCell } from '../../../list.types';


@Component({
  selector: 'app-cf-space-card',
  templateUrl: './cf-space-card.component.html',
  styleUrls: ['./cf-space-card.component.scss']
})
export class CfSpaceCardComponent extends CardCell<APIResource<ISpace>> implements OnInit, OnDestroy {
  cardMenu: MetaCardMenuItem[];
  spaceGuid: string;
  serviceInstancesCount: number;
  appInstancesCount: number;
  serviceInstancesLimit: string;
  appInstancesLimit: string;
  orgGuid: string;
  normalisedMemoryUsage: number;
  memoryLimit: string;
  subscriptions: Subscription[] = [];
  memoryTotal: number;
  appCount$: Observable<number>;
  userRolesInSpace: string;
  currentUser$: Observable<EndpointUser>;
  entityConfig: ComponentEntityMonitorConfig;
  spaceStatus$: Observable<CardStatus>;

  constructor(
    private cfUserService: CfUserService,
    public cfEndpointService: CloudFoundryEndpointService,
    private store: Store<AppState>,
    private cfOrgService: CloudFoundryOrganizationService,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    private confirmDialog: ConfirmationDialogService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private emf: EntityMonitorFactory
  ) {
    super();
  }

  ngOnInit() {
    this.spaceGuid = this.row.metadata.guid;
    this.entityConfig = new ComponentEntityMonitorConfig(this.spaceGuid, entityFactory(spaceSchemaKey));
    this.orgGuid = this.cfOrgService.orgGuid;
    this.cardMenu = [
      {
        label: 'Edit',
        action: this.edit,
        can: this.currentUserPermissionsService.can(
          CurrentUserPermissions.SPACE_EDIT,
          this.cfEndpointService.cfGuid,
          this.orgGuid,
          this.spaceGuid
        )
      },
      {
        label: 'Delete',
        action: this.delete,
        can: this.currentUserPermissionsService.can(
          CurrentUserPermissions.SPACE_DELETE,
          this.cfEndpointService.cfGuid,
          this.orgGuid
        )
      }
    ];

    const userRole$ = this.cfEndpointService.currentUser$.pipe(
      switchMap(u => this.cfUserService.getUserRoleInSpace(
        u.guid,
        this.spaceGuid,
        this.cfEndpointService.cfGuid
      )),
      map(u => getSpaceRolesString(u))
    );

    const allApps$: Observable<APIResource<IApp>[]> = this.cfEndpointService.hasAllApps$.pipe(
      switchMap(hasAll => hasAll ? this.cfEndpointService.getAppsInSpaceViaAllApps(this.row) : observableOf(null))
    );

    this.appCount$ = allApps$.pipe(
      switchMap(allApps => allApps ? observableOf(allApps.length) : CloudFoundryEndpointService.fetchAppCount(
        this.store,
        this.paginationMonitorFactory,
        this.cfEndpointService.cfGuid,
        this.orgGuid,
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

    const spaceQuotaHelper = new SpaceQuotaHelper(this.cfEndpointService, this.emf, this.spaceGuid);
    this.spaceStatus$ = spaceQuotaHelper.createStateObs();
  }

  setAppsDependentCounts = (apps: APIResource<IApp>[]) => {
    this.appInstancesCount = getStartedAppInstanceCount(apps);
  }

  setValues = (roles: string, apps: APIResource<IApp>[]) => {
    this.userRolesInSpace = roles;
    const quotaDefinition = this.row.entity.space_quota_definition || createQuotaDefinition(this.orgGuid);
    if (apps) {
      this.setAppsDependentCounts(apps);
      this.memoryTotal = this.cfEndpointService.getMetricFromApps(apps, 'memory');
      this.normalisedMemoryUsage = this.memoryTotal / quotaDefinition.entity.memory_limit * 100;
    }
    this.appInstancesLimit = truthyIncludingZeroString(quotaDefinition.entity.app_instance_limit);
    this.serviceInstancesLimit = truthyIncludingZeroString(quotaDefinition.entity.total_services);
    this.memoryLimit = truthyIncludingZeroString(quotaDefinition.entity.memory_limit);
    this.serviceInstancesCount = this.row.entity.service_instances ? this.row.entity.service_instances.length : 0;
  }

  ngOnDestroy = () => this.subscriptions.forEach(p => p.unsubscribe());

  edit = () => {
    this.store.dispatch(
      new RouterNav({
        path: ['cloud-foundry', this.cfEndpointService.cfGuid, 'organizations', this.orgGuid, 'spaces', this.spaceGuid, 'edit-space']
      })
    );
  }

  delete = () => {
    const confirmation = new ConfirmationDialogConfig(
      'Delete Space',
      {
        textToMatch: this.row.entity.name
      },
      'Delete',
      true
    );
    this.confirmDialog.open(confirmation, () => {
      this.cfOrgService.deleteSpace(
        this.spaceGuid,
        this.orgGuid,
        this.cfEndpointService.cfGuid
      );
    });
  }

  goToSummary = () => this.store.dispatch(new RouterNav({
    path: ['cloud-foundry', this.cfEndpointService.cfGuid, 'organizations', this.orgGuid, 'spaces', this.spaceGuid]
  }))
}
