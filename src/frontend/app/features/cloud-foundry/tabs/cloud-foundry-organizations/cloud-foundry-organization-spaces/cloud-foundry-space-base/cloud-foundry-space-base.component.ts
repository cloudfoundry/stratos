
import { of as observableOf, Observable, combineLatest } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { first, map } from 'rxjs/operators';

import { environment } from '../../../../../../../environments/environment';
import { IHeaderBreadcrumb } from '../../../../../../shared/components/page-header/page-header.types';
import { RouterNav } from '../../../../../../store/actions/router.actions';
import { AppState } from '../../../../../../store/app-state';
import { getActiveRouteCfOrgSpaceProvider, canUpdateOrgSpaceRoles } from '../../../../cf.helpers';
import { CloudFoundryEndpointService } from '../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../services/cloud-foundry-space.service';
import { CurrentUserPermissions } from '../../../../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../core/current-user-permissions.service';

@Component({
  selector: 'app-cloud-foundry-space-base',
  templateUrl: './cloud-foundry-space-base.component.html',
  styleUrls: ['./cloud-foundry-space-base.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CloudFoundrySpaceService,
    CloudFoundryOrganizationService
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
      // Hide the users tab unless we are in development
      hidden: observableOf(environment.production)
    }
  ];

  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  public name$: Observable<string>;

  public isFetching$: Observable<boolean>;

  // Used to hide tab that is not yet implemented when in production
  public isDevEnvironment = !environment.production;

  public permsSpaceEdit = CurrentUserPermissions.SPACE_EDIT;
  public permsSpaceDelete = CurrentUserPermissions.SPACE_DELETE;
  public canUpdateRoles$: Observable<boolean>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    private cfSpaceService: CloudFoundrySpaceService,
    private cfOrgService: CloudFoundryOrganizationService,
    private store: Store<AppState>,
    currentUserPermissionsService: CurrentUserPermissionsService
  ) {
    this.isFetching$ = cfSpaceService.space$.pipe(
      map(space => space.entityRequestInfo.fetching)
    );
    this.name$ = cfSpaceService.space$.pipe(
      map(space => space.entity.entity.name),
      first()
    );
    this.setUpBreadcrumbs(cfEndpointService, cfOrgService);

    this.canUpdateRoles$ = canUpdateOrgSpaceRoles(
      currentUserPermissionsService,
      cfSpaceService.cfGuid,
      cfSpaceService.orgGuid,
      cfSpaceService.spaceGuid);
  }

  private setUpBreadcrumbs(
    cfEndpointService: CloudFoundryEndpointService,
    cfOrgService: CloudFoundryOrganizationService
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
              routerLink: `/cloud-foundry/${endpoint.entity.guid}/organizations`
            },
            {
              value: org.entity.entity.name,
              routerLink: `/cloud-foundry/${endpoint.entity.guid}/organizations/${org.entity.metadata.guid}/spaces`
            }
          ]
        },
        {
          key: 'services-wall',
          breadcrumbs: [
            { value: 'Services', routerLink: `/services` }
          ]
        }
      ])),
      first()
    );
  }


  ngOnInit() { }

  deleteSpace = () => {
    this.cfOrgService.deleteSpace(
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
