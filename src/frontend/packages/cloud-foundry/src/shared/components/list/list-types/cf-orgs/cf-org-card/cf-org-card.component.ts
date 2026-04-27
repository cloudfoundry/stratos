import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest as observableCombineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import { map, publishReplay, refCount, switchMap, tap } from 'rxjs/operators';

import {
  CurrentUserPermissionsService,
  InfinityPipe,
  truthyIncludingZeroString,
  MbToHumanSizePipe,
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  CardCell,
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
  MultilineTitleComponent
} from '@stratosui/core';
import {
  RouterNav,
  EntityMonitorFactory,
  PaginationMonitorFactory,
  APIResource,
  EndpointUser,
  MenuItem,
  ComponentEntityMonitorConfig,
  StratosStatus,
  IFavoriteMetadata,
  UserFavorite,
  UserFavoriteManager
} from '@stratosui/store';
import {
  CFAppState,
  organizationEntityType,
  IApp,
  IOrganization,
  IOrgQuotaDefinition,
  cfEntityFactory,
  getStartedAppInstanceCount,
  getOrgRolesString,
  createOrgQuotaDefinition,
  createUserRoleInOrg,
  CfCurrentUserPermissions,
  CF_ENDPOINT_TYPE
} from '@stratosui/cloud-foundry';
import { CloudFoundryEndpointService } from '../../../../../../features/cf/services/cloud-foundry-endpoint.service';
import { OrgQuotaHelper } from '../../../../../../features/cf/services/cloud-foundry-organization-quota';
import { CfUserService } from '../../../../../data-services/cf-user.service';


@Component({
selector: 'app-cf-org-card',
  templateUrl: './cf-org-card.component.html',
  styleUrls: ['./cf-org-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    MultilineTitleComponent,
    InfinityPipe,
    MbToHumanSizePipe,
  ]
})
export class CfOrgCardComponent extends CardCell<APIResource<IOrganization>> implements OnInit, OnDestroy {
  private cfUserService = inject(CfUserService);
  cfEndpointService = inject(CloudFoundryEndpointService);
  private store = inject<Store<CFAppState>>(Store);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);
  private confirmDialog = inject(ConfirmationDialogService);
  private paginationMonitorFactory = inject(PaginationMonitorFactory);
  private emf = inject(EntityMonitorFactory);
  private userFavoriteManager = inject(UserFavoriteManager);

  cardMenu: MenuItem[];
  orgGuid!: string;
  normalisedMemoryUsage!: number;
  memoryLimit!: string;
  instancesLimit!: string;
  subscriptions: Subscription[] = [];
  memoryTotal!: number;
  instancesCount!: number;
  appCount$!: Observable<number>;
  userRolesInOrg!: string;
  currentUser$!: Observable<EndpointUser>;
  public entityConfig!: ComponentEntityMonitorConfig;
  public favorite!: UserFavorite<IFavoriteMetadata> | null;
  public orgStatus$!: Observable<StratosStatus>;

  constructor() {
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

    // Use the page's CF guid, not the entity row's stamped cfGuid — when
    // multiple Stratos endpoints point at the same CAPI, ngrx dedupes org
    // rows across endpoints and the row's cfGuid stamp belongs to whichever
    // endpoint fetched it last, which would leak favorites visually onto
    // sibling endpoint pages.
    this.favorite = this.userFavoriteManager.getFavoriteFromEntity(
      organizationEntityType,
      CF_ENDPOINT_TYPE,
      this.cfEndpointService.cfGuid,
      this.row
    );

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
    const quotaDefinition = this.row.entity.quota_definition || { entity: createOrgQuotaDefinition(), metadata: null } as APIResource<IOrgQuotaDefinition>;

    // Debug: Log quota definition data
    if (!this.row.entity.quota_definition) {
      console.warn(`[CfOrgCard] Missing quota_definition for org: ${this.row.entity.name}`, {
        row: this.row,
        hasQuotaGuid: !!this.row.entity.quota_definition_guid,
        quotaGuid: this.row.entity.quota_definition_guid
      });
    }

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
