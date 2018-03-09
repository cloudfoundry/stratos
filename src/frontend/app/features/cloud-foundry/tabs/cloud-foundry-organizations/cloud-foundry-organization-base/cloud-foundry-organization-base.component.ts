import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { EntityServiceFactory } from '../../../../../core/entity-service-factory.service';
import { ISubHeaderTabs } from '../../../../../shared/components/page-subheader/page-subheader.types';
import { CfOrgSpaceDataService } from '../../../../../shared/data-services/cf-org-space-service.service';
import { CfUserService } from '../../../../../shared/data-services/cf-user.service';
import { PaginationMonitorFactory } from '../../../../../shared/monitors/pagination-monitor.factory';
import { AppState } from '../../../../../store/app-state';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganisationService } from '../../../services/cloud-foundry-organisation.service';
import { getActiveRouteCfOrgSpaceProvider } from '../../../cf.helpers';

@Component({
  selector: 'app-cloud-foundry-organization-base',
  templateUrl: './cloud-foundry-organization-base.component.html',
  styleUrls: ['./cloud-foundry-organization-base.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CloudFoundryOrganisationService
  ]
})

export class CloudFoundryOrganizationBaseComponent implements OnInit {

  tabLinks: ISubHeaderTabs[] = [
    {
      link: 'summary',
      label: 'Summary'
    },
    {
      link: 'spaces',
      label: 'Spaces'
    }, {
      link: 'users',
      label: 'Users'
    }
  ];

  constructor(private cfEndpointService: CloudFoundryEndpointService, private cfOrgService: CloudFoundryOrganisationService) { }

  ngOnInit() {
  }

}
