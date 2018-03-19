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
import { Observable } from 'rxjs/Observable';
import { IHeaderBreadcrumb } from '../../../../../../shared/components/page-header/page-header.types';
import { map, first } from 'rxjs/operators';
import { CloudFoundryOrganisationService } from '../../../../services/cloud-foundry-organisation.service';
import { combineLatest } from 'rxjs/observable/combineLatest';

@Component({
  selector: 'app-cloud-foundry-space-base',
  templateUrl: './cloud-foundry-space-base.component.html',
  styleUrls: ['./cloud-foundry-space-base.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CloudFoundrySpaceService,
    CloudFoundryOrganisationService
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

  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  public name$: Observable<string>;

  public isFetching$: Observable<boolean>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    private cfSpaceService: CloudFoundrySpaceService,
    private cfOrgSpaceService: CfOrgSpaceDataService,
    private cfOrgService: CloudFoundryOrganisationService,
    private store: Store<AppState>
  ) {
    this.isFetching$ = cfSpaceService.space$.pipe(
      map(space => space.entityRequestInfo.fetching)
    );
    this.name$ = cfSpaceService.space$.pipe(
      map(space => space.entity.entity.name),
      first()
    );
    this.setUpBreadcrumbs(cfEndpointService, cfOrgService);
  }

  private setUpBreadcrumbs(
    cfEndpointService: CloudFoundryEndpointService,
    cfOrgService: CloudFoundryOrganisationService
  ) {
    this.breadcrumbs$ = combineLatest(
      cfEndpointService.endpoint$,
      cfOrgService.org$
    ).pipe(
      map(([endpoint, org]) => ([
        {
          breadcrumbs: [
            {
              value: endpoint.entity.name,
              routerLink: `/cloud-foundry/${endpoint.entity.guid}/summary`
            },
            {
              value: org.entity.entity.name,
              routerLink: `/cloud-foundry/${endpoint.entity.guid}/organizations/${org.entity.metadata.guid}`
            }
          ]
        }
      ])),
      first()
    );
  }


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
