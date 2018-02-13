import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map, switchMap, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import { getOrgRolesString } from '../../../../../../features/cloud-foundry/cf.helpers';
import {
  CloudFoundryEndpointService,
} from '../../../../../../features/cloud-foundry/cloud-foundry-base/cloud-foundry-endpoint.service';
import { RouterNav } from '../../../../../../store/actions/router.actions';
import { AppState } from '../../../../../../store/app-state';
import { APIResource } from '../../../../../../store/types/api.types';
import { EndpointUser } from '../../../../../../store/types/endpoint.types';
import { CfOrgSpaceDataService } from '../../../../../data-services/cf-org-space-service.service';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';

@Component({
  selector: 'app-cf-org-card',
  templateUrl: './cf-org-card.component.html',
  styleUrls: ['./cf-org-card.component.scss']
})
export class CfOrgCardComponent extends TableCellCustom<APIResource>
  implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  memoryTotal$: Observable<number>;
  instancesCount: number;
  orgApps$: Observable<APIResource<any>[]>;
  appCount: number;
  userRolesInOrg$: Observable<string>;
  currentUser$: Observable<EndpointUser>;
  @Input('row') row;

  constructor(
    private cfUserService: CfUserService,
    private cfEndpointService: CloudFoundryEndpointService,
    private entityServiceFactory: EntityServiceFactory,
    private store: Store<AppState>,
    private cfOrgSpaceDataService: CfOrgSpaceDataService
  ) {
    super();
  }

  ngOnInit() {
    this.userRolesInOrg$ = this.cfEndpointService.currentUser$.pipe(
      switchMap(u => {
        return this.cfUserService.getUserRoleInOrg(
          u.guid,
          this.row.entity.guid,
          this.row.entity.cfGuid
        );
      }),
      map(u => getOrgRolesString(u))
    );

    this.orgApps$ = this.cfEndpointService.getAppsOrg(this.row);

    const fetchCounts = this.orgApps$.pipe(
      tap(apps => {
        this.appCount = apps.length;
        let count = 0;
        apps.forEach(a => {
          count += a.entity.instances;
        });
        this.instancesCount = count;
      })
    );
    this.subscriptions.push(fetchCounts.subscribe());

    this.memoryTotal$ = this.cfEndpointService.getAggregateStat(
      this.row,
      'memory'
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(p => p.unsubscribe());
  }

  edit = () => {
    this.store.dispatch(
      new RouterNav({
        path: ['cloud-foundry', this.cfEndpointService.cfGuid, 'edit-org']
      })
    );
  }

  delete = () => {
    this.cfOrgSpaceDataService.deleteOrg(
      this.row.entity.guid,
      this.cfEndpointService.cfGuid
    );
  }
}
