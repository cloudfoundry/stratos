import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { AppState } from '../../../store/app-state';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';
import { tap } from 'rxjs/operators';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';

const cfEndpointServiceFactory = (
  store: Store<AppState>,
  activatedRoute: ActivatedRoute,
  entityServiceFactory: EntityServiceFactory,
  cfOrgSpaceDataService: CfOrgSpaceDataService,
  cfUserService: CfUserService,
  paginationMonitorFactory: PaginationMonitorFactory
) => {
  const { cfId } = activatedRoute.snapshot.params;
  return new CloudFoundryEndpointService(
    cfId,
    store,
    entityServiceFactory,
    cfOrgSpaceDataService,
    cfUserService,
    paginationMonitorFactory
  );
};

@Component({
  selector: 'app-cloud-foundry-base',
  templateUrl: './cloud-foundry-base.component.html',
  styleUrls: ['./cloud-foundry-base.component.scss'],
  providers: [
    {
      provide: CloudFoundryEndpointService,
      useFactory: cfEndpointServiceFactory,
      deps: [
        Store,
        ActivatedRoute,
        EntityServiceFactory,
        CfOrgSpaceDataService,
        CfUserService,
        PaginationMonitorFactory
      ]
    }
  ]
})
export class CloudFoundryBaseComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
