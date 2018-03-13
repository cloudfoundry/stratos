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
import { RouterNav } from '../../../../../../store/actions/router.actions';
import { getActiveRouteCfOrgSpaceProvider } from '../../../../cf.helpers';

@Component({
  selector: 'app-cloud-foundry-space-base',
  templateUrl: './cloud-foundry-space-base.component.html',
  styleUrls: ['./cloud-foundry-space-base.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CloudFoundrySpaceService
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

  constructor(
    private cfEndpointService: CloudFoundryEndpointService,
    private cfSpaceService: CloudFoundrySpaceService,
    private cfOrgSpaceService: CfOrgSpaceDataService,
    private store: Store<AppState>
  ) { }

  ngOnInit() { }

  deleteSpace = () => {
    this.cfOrgSpaceService.deleteSpace(
      this.cfSpaceService.spaceGuid,
      this.cfSpaceService.orgGuid,
      this.cfSpaceService.cfGuid
    );

    this.store.dispatch(new RouterNav({
      path: [
        'cloud-foundry',
        this.cfSpaceService.cfGuid,
        'organizations',
        this.cfSpaceService.orgGuid,
        'spaces']
    }
    ));
  }

}
