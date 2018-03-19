import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map, switchMap, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { ISpace } from '../../../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import { getSpaceRolesString } from '../../../../../../features/cloud-foundry/cf.helpers';
import {
  CloudFoundryEndpointService,
} from '../../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import {
  CloudFoundryOrganizationService,
} from '../../../../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { RouterNav } from '../../../../../../store/actions/router.actions';
import { AppState } from '../../../../../../store/app-state';
import { APIResource } from '../../../../../../store/types/api.types';
import { EndpointUser } from '../../../../../../store/types/endpoint.types';
import { CfOrgSpaceDataService } from '../../../../../data-services/cf-org-space-service.service';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { MetaCardMenuItem } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';

@Component({
  selector: 'app-cf-space-card',
  templateUrl: './cf-space-card.component.html',
  styleUrls: ['./cf-space-card.component.scss']
})
export class CfSpaceCardComponent extends TableCellCustom<APIResource<ISpace>>
  implements OnInit, OnDestroy {
  cardMenu: MetaCardMenuItem[];
  spaceGuid: string;
  serviceInstancesCount: number;
  appInstancesCount: number;
  serviceInstancesLimit: number;
  appIntancesLimit: number;
  orgGuid: string;
  normalisedMemoryUsage: number;
  memoryLimit: number;
  instancesLimit: number;
  subscriptions: Subscription[] = [];
  memoryTotal: number;
  orgApps$: Observable<APIResource<any>[]>;
  appCount: number;
  userRolesInOrg: string;
  currentUser$: Observable<EndpointUser>;

  @Input('row') row: APIResource<ISpace>;

  constructor(
    private cfUserService: CfUserService,
    private cfEndpointService: CloudFoundryEndpointService,
    private entityServiceFactory: EntityServiceFactory,
    private store: Store<AppState>,
    private cfOrgSpaceDataService: CfOrgSpaceDataService,
    private cfOrgService: CloudFoundryOrganizationService,
  ) {
    super();

    this.cardMenu = [
      {
        icon: 'mode_edit',
        label: 'Edit',
        action: this.edit
      },
      {
        icon: 'delete',
        label: 'Delete',
        action: this.delete
      }
    ];
  }

  ngOnInit() {
    this.spaceGuid = this.row.metadata.guid;

    const userRole$ = this.cfEndpointService.currentUser$.pipe(
      switchMap(u => {
        return this.cfUserService.getUserRoleInSpace(
          u.guid,
          this.spaceGuid,
          this.cfEndpointService.cfGuid
        );
      }),
      map(u => getSpaceRolesString(u))
    );


    const fetchData$ = userRole$.pipe(
      tap((role) => {
        this.setValues(role);
      })
    );

    this.subscriptions.push(fetchData$.subscribe());
    this.orgGuid = this.cfOrgService.orgGuid;

  }

  setCounts = () => {
    this.appCount = this.row.entity.apps ? this.row.entity.apps.length : 0;
    let count = 0;
    if (this.appCount > 0) {
      this.row.entity.apps.forEach(a => {
        count += a.entity.instances;
      });
    } else {
      count = 0;
    }

    this.appInstancesCount = count;
    this.serviceInstancesCount = this.row.entity.service_instances ? this.row.entity.service_instances.length : 0;
  }

  setValues = (role: string) => {
    this.userRolesInOrg = role;
    this.setCounts();
    this.memoryTotal = this.cfEndpointService.getMetricFromApps(this.row.entity.apps, 'memory');
    let quotaDefinition = this.row.entity.space_quota_definition;
    if (!quotaDefinition) {
      quotaDefinition = {
        entity: {
          memory_limit: -1,
          app_instance_limit: -1,
          instance_memory_limit: -1,
          name: 'None assigned',
          organization_guid: this.orgGuid,
          total_services: -1,
          total_routes: -1
        },
        metadata: null
      };
    }
    this.appIntancesLimit = quotaDefinition.entity.app_instance_limit;
    this.serviceInstancesLimit = quotaDefinition.entity.total_services;
    this.memoryLimit = quotaDefinition.entity.memory_limit;
    this.normalisedMemoryUsage = this.memoryTotal / this.memoryLimit * 100;
  }

  ngOnDestroy = () => this.
    subscriptions.forEach(p =>
      p.unsubscribe())


  edit = () => {
    this.store.dispatch(
      new RouterNav({
        path: ['cloud-foundry', this.cfEndpointService.cfGuid, 'organizations', this.orgGuid, 'spaces', this.spaceGuid, 'edit-space']
      })
    );
  }

  delete = () => {
    this.cfOrgSpaceDataService.deleteSpace(
      this.spaceGuid,
      this.orgGuid,
      this.cfEndpointService.cfGuid
    );
  }

  goToSummary = () => this.store.dispatch(new RouterNav({
    path: ['cloud-foundry', this.cfEndpointService.cfGuid, 'organizations', this.orgGuid, 'spaces', this.spaceGuid]
  }))
}
