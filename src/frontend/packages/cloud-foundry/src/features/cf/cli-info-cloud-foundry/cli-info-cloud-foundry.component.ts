import { Component, OnInit, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { CustomTooltipDirective } from '@stratosui/core';
import { RoutingHistoryService } from '@stratosui/store';

import { PageHeaderComponent } from '../../../../../core/src/shared/components/page-header/page-header.component';
import { IHeaderBreadcrumb } from '../../../../../core/src/shared/components/page-header/page-header.types';
import { getFullEndpointApiUrl } from '../../../../../store/src/endpoint-utils';
import {
  CLOUD_FOUNDRY_CLI_COMMANDS,
  ORGANIZATION_CLI_COMMANDS,
  SPACE_CLI_COMMANDS,
} from '../../../shared/components/cli-info/cli-commands';
import { CFAppCLIInfoContext, CliInfoComponent } from '../../../shared/components/cli-info/cli-info.component';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../shared/services/cloud-foundry-user-provided-services.service';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../services/cloud-foundry-space.service';


@Component({
  selector: 'app-cli-info-cloud-foundry',
  templateUrl: './cli-info-cloud-foundry.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CustomTooltipDirective,
    PageHeaderComponent,
    CliInfoComponent,
  ],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CloudFoundryEndpointService,
    CloudFoundryOrganizationService,
    CloudFoundrySpaceService,
    CloudFoundryUserProvidedServicesService
  ]
})
export class CliInfoCloudFoundryComponent implements OnInit {
  private router = inject(Router);
  private routingHistory = inject(RoutingHistoryService);
  activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private cfEndpointService = inject(CloudFoundryEndpointService);
  // Both services request their organization or space when they are built,
  // so each is asked for only on a route that names one.
  private cfOrgService = this.activeRouteCfOrgSpace.orgGuid ? inject(CloudFoundryOrganizationService) : null;
  private cfSpaceService = this.activeRouteCfOrgSpace.spaceGuid ? inject(CloudFoundrySpaceService) : null;

  // The commands of this level: the page serves a Cloud Foundry, an
  // organization or a space, by what the route names.
  readonly sections = this.activeRouteCfOrgSpace.spaceGuid ? SPACE_CLI_COMMANDS
    : this.activeRouteCfOrgSpace.orgGuid ? ORGANIZATION_CLI_COMMANDS
    : CLOUD_FOUNDRY_CLI_COMMANDS;

  public previousUrl!: string;
  public previousQueryParams!: {
    [key: string]: string;
  };


  // The endpoint with the route's organization and space, once each one the
  // route names has loaded: otherwise a page opened by its address would show
  // placeholders for names the route has.
  private readonly endpointOrgSpace = computed(() => {
    const cf = this.cfEndpointService.endpoint();
    const org = this.cfOrgService?.orgDataService.org() ?? null;
    const space = this.cfSpaceService?.spaceDataService.space() ?? null;
    if (!cf || (this.cfOrgService && !org) || (this.cfSpaceService && !space)) {
      return null;
    }
    return { cf, org, space };
  });

  readonly context = computed<CFAppCLIInfoContext | null>(() => {
    const loaded = this.endpointOrgSpace();
    if (!loaded) return null;
    const { cf, org, space } = loaded;
    return {
      // CFAppCLIInfoContext requires string org/space names; templates render
      // falsy values as a '[...]' placeholder, so the empty-string "absent"
      // marker is behaviourally identical to the prior null.
      orgName: org ? org.name : '',
      spaceName: space ? space.name : '',
      apiEndpoint: getFullEndpointApiUrl(cf.entity),
      username: cf.entity.user ? cf.entity.user.name : '',
      skipSslValidation: !!cf.entity.skip_ssl_validation,
      ssoAllowed: !!cf.entity.sso_allowed
    };
  });

  readonly breadcrumbs = computed<IHeaderBreadcrumb[] | null>(() => {
    const loaded = this.endpointOrgSpace();
    if (!loaded) return null;
    const { cf, org, space } = loaded;
    const breadcrumbs = [{
      value: cf.entity.name,
      routerLink: `/cloud-foundry/${cf.entity.guid}`
    }];
    if (org) {
      breadcrumbs.push({
        value: org.name,
        routerLink: `/cloud-foundry/${cf.entity.guid}/organizations/${org.guid}`
      });
      if (space) {
        breadcrumbs.push({
          value: space.name,
          routerLink: `/cloud-foundry/${cf.entity.guid}/organizations/${org.guid}/spaces/${space.guid}`
        });
      }
    }
    return [{ breadcrumbs }];
  });

  ngOnInit() {
    // The page before this one; by ngOnInit the navigation here is recorded.
    const route = this.routingHistory.previousState();
    this.previousUrl = route && route.state ? route.state.url : this.getDefaultBackLink();
    this.previousQueryParams = route && route.state && route.state.queryParams ? route.state.queryParams : {};

  }

  private getDefaultBackLink(): string {
    const { cfGuid, orgGuid, spaceGuid } = this.activeRouteCfOrgSpace;
    let backLink = `/cloud-foundry/${cfGuid}`;
    if (orgGuid) {
      backLink = `${backLink}/organizations/${orgGuid}`;
      if (spaceGuid) {
        backLink = `${backLink}/spaces/${spaceGuid}`;
      }
    }
    return backLink;
  }


  back() {
    // Direct Angular Router navigation, replacing the ngrx RouterNav dispatch
    // (the RouterEffect did exactly this: split a string path into segments
    // and pass query params through NavigationExtras).
    this.router.navigate(this.previousUrl.split('/'), { queryParams: this.previousQueryParams });
  }
}
