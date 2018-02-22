import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import { CfOrgSpaceDataService } from '../../../../../../shared/data-services/cf-org-space-service.service';
import { CfUserService } from '../../../../../../shared/data-services/cf-user.service';
import { PaginationMonitorFactory } from '../../../../../../shared/monitors/pagination-monitor.factory';
import { AppState } from '../../../../../../store/app-state';
import { CloudFoundryEndpointService } from '../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundrySpaceService } from '../../../../services/cloud-foundry-space.service';

const cfSpaceServiceFactory = (
  store: Store<AppState>,
  activatedRoute: ActivatedRoute,
  entityServiceFactory: EntityServiceFactory,
  cfOrgSpaceDataService: CfOrgSpaceDataService,
  cfUserService: CfUserService,
  paginationMonitorFactory: PaginationMonitorFactory,
  cfEndpointService: CloudFoundryEndpointService
) => {
  const { orgId, spaceId } = activatedRoute.snapshot.params;
  const { cfGuid } = cfEndpointService;
  return new CloudFoundrySpaceService(
    cfGuid,
    orgId,
    spaceId,
    store,
    entityServiceFactory,
    cfUserService,
    paginationMonitorFactory,
    cfEndpointService
  );
};

@Component({
  selector: 'app-cloud-foundry-space-base',
  templateUrl: './cloud-foundry-space-base.component.html',
  styleUrls: ['./cloud-foundry-space-base.component.scss'],
  providers: [
    {
      provide: CloudFoundrySpaceService,
      useFactory: cfSpaceServiceFactory,
      deps: [
        Store,
        ActivatedRoute,
        EntityServiceFactory,
        CfOrgSpaceDataService,
        CfUserService,
        PaginationMonitorFactory,
        CloudFoundryEndpointService
      ]
    }
  ]
})
export class CloudFoundrySpaceBaseComponent implements OnInit {

  tabLinks = [
    {
      link: 'summary',
      label: 'Summary',
    },
    {
      link: 'apps',
      label: 'Applications',
    },
    {
      link: 'service-instances',
      label: 'Service Instances'
    },
    {
      link: 'routes',
      label: 'Routes',
    },
    {
      link: 'users',
      label: 'Users',
    }
  ];
  constructor(private cfEndpointService: CloudFoundryEndpointService) { }

  ngOnInit() {
  }

}
