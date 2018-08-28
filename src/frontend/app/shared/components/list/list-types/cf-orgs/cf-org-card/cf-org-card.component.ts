import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest as observableCombineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

import { IApp, IOrganization } from '../../../../../../core/cf-api.types';
import { getStartedAppInstanceCount } from '../../../../../../core/cf.helpers';
import { CurrentUserPermissions } from '../../../../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../core/current-user-permissions.service';
import { getOrgRolesString } from '../../../../../../features/cloud-foundry/cf.helpers';
import {
  CloudFoundryEndpointService,
} from '../../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { RouterNav } from '../../../../../../store/actions/router.actions';
import { AppState } from '../../../../../../store/app-state';
import { entityFactory, organizationSchemaKey } from '../../../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../../../store/types/api.types';
import { EndpointUser } from '../../../../../../store/types/endpoint.types';
import { createUserRoleInOrg } from '../../../../../../store/types/user.types';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { ComponentEntityMonitorConfig } from '../../../../../shared.types';
import { ConfirmationDialogConfig } from '../../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../confirmation-dialog.service';
import { MetaCardMenuItem } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { CardCell } from '../../../list.types';


@Component({
  selector: 'app-cf-org-card',
  templateUrl: './cf-org-card.component.html',
  styleUrls: ['./cf-org-card.component.scss']
})
export class CfOrgCardComponent extends CardCell<APIResource<IOrganization>> implements OnInit, OnDestroy {
  cardMenu: MetaCardMenuItem[];
  orgGuid: string;
  normalisedMemoryUsage: number;
  memoryLimit: number;
  instancesLimit: number;
  subscriptions: Subscription[] = [];
  memoryTotal: number;
  instancesCount: number;
  orgApps$: Observable<APIResource<any>[]>;
  appCount: number;
  userRolesInOrg: string;
  currentUser$: Observable<EndpointUser>;
  public entityConfig: ComponentEntityMonitorConfig;

  constructor(
    private cfUserService: CfUserService,
    private cfEndpointService: CloudFoundryEndpointService,
    private store: Store<AppState>,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    private confirmDialog: ConfirmationDialogService
  ) {
    super();

    this.cardMenu = [
      {
        label: 'Edit',
        action: this.edit,
        can: this.currentUserPermissionsService.can(CurrentUserPermissions.ORGANIZATION_EDIT, this.cfEndpointService.cfGuid)
      },
      {
        label: 'Delete',
        action: this.delete,
        can: this.currentUserPermissionsService.can(CurrentUserPermissions.ORGANIZATION_DELETE, this.cfEndpointService.cfGuid)
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
    );

    const fetchData$ = observableCombineLatest(
      userRole$,
      this.cfEndpointService.getAppsInOrg(this.row)
    ).pipe(
      tap(([role, apps]) => {
        this.setValues(role, apps);
      })
    );

    this.subscriptions.push(fetchData$.subscribe());
    this.orgGuid = this.row.metadata.guid;
    this.entityConfig = new ComponentEntityMonitorConfig(this.orgGuid, entityFactory(organizationSchemaKey));
  }

  setCounts = (apps: APIResource<any>[]) => {
    this.appCount = apps.length;
    this.instancesCount = getStartedAppInstanceCount(apps);
  }

  setValues = (role: string, apps: APIResource<IApp>[]) => {
    this.userRolesInOrg = role;
    this.setCounts(apps);
    this.memoryTotal = this.cfEndpointService.getMetricFromApps(apps, 'memory');
    const quotaDefinition = this.row.entity.quota_definition;
    this.instancesLimit = quotaDefinition.entity.app_instance_limit;
    this.memoryLimit = quotaDefinition.entity.memory_limit;
    this.
      normalisedMemoryUsage = this.memoryTotal / this.memoryLimit * 100;
  }

  ngOnDestroy = () => this.
    subscriptions.forEach(p =>
      p.unsubscribe())


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
      `Are you sure you want to delete organization '${this.row.entity.name}'?`,
      'Delete',
      true
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
