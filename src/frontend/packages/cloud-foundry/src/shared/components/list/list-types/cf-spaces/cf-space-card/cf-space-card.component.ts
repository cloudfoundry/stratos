import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit , ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest as observableCombineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { spaceEntityType } from '../../../../../../../../cloud-foundry/src/cf-entity-types';
import { ISpaceFavMetadata } from '../../../../../../../../cloud-foundry/src/cf-metadata-types';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { InfinityPipe } from '../../../../../../../../core/src/core/infinity.pipe';
import { MbToHumanSizePipe } from '../../../../../../../../core/src/shared/pipes/mb-to-human-size.pipe';
import { truthyIncludingZeroString } from '../../../../../../../../core/src/core/utils.service';
import { ConfirmationDialogConfig } from '../../../../../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { CardCell } from '../../../../../../../../core/src/shared/components/list/list.types';
import {
  MetaCardComponent,
} from '../../../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-base/meta-card.component';
import {
  MetaCardItemComponent,
} from '../../../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-item/meta-card-item.component';
import {
  MetaCardKeyComponent,
} from '../../../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-key/meta-card-key.component';
import {
  MetaCardTitleComponent,
} from '../../../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-title/meta-card-title.component';
import {
  MetaCardValueComponent,
} from '../../../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-value/meta-card-value.component';
import { MultilineTitleComponent } from '../../../../../../../../core/src/shared/components/multiline-title/multiline-title.component';
import { RouterNav } from '../../../../../../../../store/src/actions/router.actions';
import { EntityMonitorFactory } from '../../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../../../store/src/monitors/pagination-monitor.factory';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { EndpointUser } from '../../../../../../../../store/src/types/endpoint.types';
import { MenuItem } from '../../../../../../../../store/src/types/menu-item.types';
import { ComponentEntityMonitorConfig, StratosStatus } from '../../../../../../../../store/src/types/shared.types';
import { UserFavorite } from '../../../../../../../../store/src/types/user-favorites.types';
import { UserFavoriteManager } from '../../../../../../../../store/src/user-favorite-manager';
import { IApp, ISpace } from '../../../../../../cf-api.types';
import { cfEntityFactory } from '../../../../../../cf-entity-factory';
import { CF_ENDPOINT_TYPE } from '../../../../../../cf-types';
import { getStartedAppInstanceCount } from '../../../../../../cf.helpers';
import { getSpaceRolesString } from '../../../../../../features/cf/cf.helpers';
import { CloudFoundryEndpointService } from '../../../../../../features/cf/services/cloud-foundry-endpoint.service';
import {
  CloudFoundryOrganizationService,
  createSpaceQuotaDefinition,
} from '../../../../../../features/cf/services/cloud-foundry-organization.service';
import { SpaceQuotaHelper } from '../../../../../../features/cf/services/cloud-foundry-space-quota';
import { CfCurrentUserPermissions } from '../../../../../../user-permissions/cf-user-permissions-checkers';
import { CfUserService } from '../../../../../data-services/cf-user.service';

@Component({
  selector: 'app-cf-space-card',
  templateUrl: './cf-space-card.component.html',
  styleUrls: ['./cf-space-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MetaCardComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardTitleComponent,
    MetaCardValueComponent,
    MultilineTitleComponent,
    InfinityPipe,
    MbToHumanSizePipe,
  ]
})
export class CfSpaceCardComponent extends CardCell<APIResource<ISpace>> implements OnInit, OnDestroy {
  cardMenu!: MenuItem[];
  spaceGuid!: string;
  appInstancesCount!: number;
  appInstancesLimit!: string | null;
  orgGuid!: string;
  normalisedMemoryUsage!: number;
  memoryLimit!: string | null;
  subscriptions: Subscription[] = [];
  memoryTotal!: number;
  appCount$!: Observable<number>;
  userRolesInSpace!: string;
  currentUser$!: Observable<EndpointUser>;
  entityConfig!: ComponentEntityMonitorConfig;
  favorite: UserFavorite<ISpaceFavMetadata> | undefined;
  spaceStatus$!: Observable<StratosStatus>;

  constructor(
    private cfUserService: CfUserService,
    public cfEndpointService: CloudFoundryEndpointService,
    private store: Store<CFAppState>,
    private cfOrgService: CloudFoundryOrganizationService,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    private confirmDialog: ConfirmationDialogService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private emf: EntityMonitorFactory,
    private userFavoriteManager: UserFavoriteManager
  ) {
    super();
  }

  ngOnInit() {
    this.spaceGuid = this.row.metadata.guid;
    this.entityConfig = new ComponentEntityMonitorConfig(this.spaceGuid, cfEntityFactory(spaceEntityType));
    this.orgGuid = this.cfOrgService.orgGuid;
    this.favorite = this.userFavoriteManager.getFavorite(this.row, spaceEntityType, CF_ENDPOINT_TYPE);
    this.cardMenu = [
      {
        label: 'Edit',
        action: this.edit,
        can: this.currentUserPermissionsService.can(
          CfCurrentUserPermissions.SPACE_EDIT,
          this.cfEndpointService.cfGuid,
          this.orgGuid,
          this.spaceGuid
        )
      },
      {
        label: 'Delete',
        action: this.delete,
        can: this.currentUserPermissionsService.can(
          CfCurrentUserPermissions.SPACE_DELETE,
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

    const allApps$: Observable<APIResource<IApp>[]> = this.cfEndpointService.appsPagObs.hasEntities$.pipe(
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
    const quotaDefinition = this.row.entity.space_quota_definition ?
      this.row.entity.space_quota_definition.entity : createSpaceQuotaDefinition(this.orgGuid);
    if (apps) {
      this.setAppsDependentCounts(apps);
      this.memoryTotal = this.cfEndpointService.getMetricFromApps(apps, 'memory');
      this.normalisedMemoryUsage = this.memoryTotal / quotaDefinition.memory_limit * 100;
    }
    this.appInstancesLimit = truthyIncludingZeroString(quotaDefinition.app_instance_limit);
    this.memoryLimit = truthyIncludingZeroString(quotaDefinition.memory_limit);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(p => p.unsubscribe());
  }

  edit = () => {
    this.store.dispatch(
      new RouterNav({
        path: [
          'cloud-foundry', this.cfEndpointService.cfGuid, 'organizations', this.orgGuid, 'spaces', this.spaceGuid, 'edit-space'
        ]
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
