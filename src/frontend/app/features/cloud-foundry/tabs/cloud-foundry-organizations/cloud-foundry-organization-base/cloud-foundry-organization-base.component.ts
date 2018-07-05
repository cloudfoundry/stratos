
import { of as observableOf, Observable } from 'rxjs';
import { Component } from '@angular/core';
import { first, map } from 'rxjs/operators';

import { environment } from '../../../../../../environments/environment';
import { CurrentUserPermissions } from '../../../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../core/current-user-permissions.service';
import { IHeaderBreadcrumb } from '../../../../../shared/components/page-header/page-header.types';
import { ISubHeaderTabs } from '../../../../../shared/components/page-subheader/page-subheader.types';
import { getActiveRouteCfOrgSpaceProvider, canUpdateOrgSpaceRoles } from '../../../cf.helpers';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import { CurrentUserPermissionsChecker } from '../../../../../core/current-user-permissions.checker';
import { organizationSchemaKey, entityFactory, EntitySchema } from '../../../../../store/helpers/entity-factory';
import { CfUserService } from '../../../../../shared/data-services/cf-user.service';

@Component({
  selector: 'app-cloud-foundry-organization-base',
  templateUrl: './cloud-foundry-organization-base.component.html',
  styleUrls: ['./cloud-foundry-organization-base.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CfUserService,
    CloudFoundryEndpointService,
    CloudFoundryOrganizationService
  ]
})

export class CloudFoundryOrganizationBaseComponent {

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
    }
  ];

  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  public name$: Observable<string>;

  // Used to hide tab that is not yet implemented when in production
  public isDevEnvironment = !environment.production;

  public permsOrgEdit = CurrentUserPermissions.ORGANIZATION_EDIT;
  public permsSpaceCreate = CurrentUserPermissions.SPACE_CREATE;
  public canUpdateRoles$: Observable<boolean>;
  public schema: EntitySchema;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    public cfOrgService: CloudFoundryOrganizationService,
    currentUserPermissionsService: CurrentUserPermissionsService
  ) {
    this.schema = entityFactory(organizationSchemaKey);

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

    this.canUpdateRoles$ = canUpdateOrgSpaceRoles(
      currentUserPermissionsService,
      cfOrgService.cfGuid,
      cfOrgService.orgGuid,
      CurrentUserPermissionsChecker.ALL_SPACES);
  }

}
