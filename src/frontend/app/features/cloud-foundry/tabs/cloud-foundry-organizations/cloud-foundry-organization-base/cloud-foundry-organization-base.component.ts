import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { first, map } from 'rxjs/operators';

import { IHeaderBreadcrumb } from '../../../../../shared/components/page-header/page-header.types';
import { ISubHeaderTabs } from '../../../../../shared/components/page-subheader/page-subheader.types';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import { getActiveRouteCfOrgSpaceProvider } from '../../../cf.helpers';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-cloud-foundry-organization-base',
  templateUrl: './cloud-foundry-organization-base.component.html',
  styleUrls: ['./cloud-foundry-organization-base.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CloudFoundryEndpointService,
    CloudFoundryOrganizationService
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
    },
    {
      link: 'users',
      label: 'Users',
      // Hide the users tab unless we are in development
      hidden: environment.production
    }
  ];

  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  public name$: Observable<string>;

  public isFetching$: Observable<boolean>;

  constructor(public cfEndpointService: CloudFoundryEndpointService, public cfOrgService: CloudFoundryOrganizationService) {
    this.isFetching$ = cfOrgService.org$.pipe(
      map(org => org.entityRequestInfo.fetching)
    );
    this.name$ = cfOrgService.org$.pipe(
      map(org => org.entity.entity.name),
      first()
    );
    this.breadcrumbs$ = cfEndpointService.endpoint$.pipe(
      map(endpoint => ([
        {
          breadcrumbs: [
            {
              value: endpoint.entity.name,
              routerLink: `/cloud-foundry/${endpoint.entity.guid}/organizations`
            }
          ]
        }
      ])),
      first()
    );
  }

  ngOnInit() {
  }

}
