import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, Injector, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { CustomTooltipDirective } from '@stratosui/core';
import { RoutingHistoryService } from '@stratosui/store';
import { BehaviorSubject, combineLatest, Observable, of as observableOf } from 'rxjs';
import { filter, take, map } from 'rxjs/operators';

import { PageHeaderComponent } from '../../../../../core/src/shared/components/page-header/page-header.component';
import { IHeaderBreadcrumb } from '../../../../../core/src/shared/components/page-header/page-header.types';
import { getFullEndpointApiUrl } from '../../../../../store/src/endpoint-utils';
import { EntityInfo } from '../../../../../store/src/types/api.types';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { StOrgDetail, StSpace } from '../../../services/endpoint-data/stratos-types';
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
    CommonModule,
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
  private injector = inject(Injector);

  // The commands of this level: the page serves a Cloud Foundry, an
  // organization or a space, by what the route names.
  readonly sections = this.activeRouteCfOrgSpace.spaceGuid ? SPACE_CLI_COMMANDS
    : this.activeRouteCfOrgSpace.orgGuid ? ORGANIZATION_CLI_COMMANDS
    : CLOUD_FOUNDRY_CLI_COMMANDS;

  cfEndpointEntityService: any;
  public previousUrl!: string;
  public previousQueryParams!: {
    [key: string]: string;
  };

  public context$!: Observable<CFAppCLIInfoContext>;
  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;
  public route$!: Observable<{ url: string, queryParams: any }>;

  public endpointOrgSpace$!: Observable<[
    EntityInfo<EndpointModel>,
    StOrgDetail | null,
    StSpace | null
  ]>;

  constructor() {
    this.breadcrumbs$ = new BehaviorSubject<IHeaderBreadcrumb[]>([]);
  }

  ngOnInit() {
    this.setupRouteObservable(this.getDefaultBackLink());
    // Will auto unsubscribe as we are using 'first'
    this.route$.pipe(take(1)).subscribe(route => {
      this.previousUrl = route.url;
      this.previousQueryParams = route.queryParams;
    });

    this.setupObservables();
    this.setupBreadcrumbs();
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

  private setupRouteObservable(defaultBackLink: string) {
    this.route$ = this.routingHistory.previousState$.pipe(
      map(route => {
        return {
          url: route && route.state ? route.state.url : defaultBackLink,
          queryParams: route && route.state && route.state.queryParams ? route.state.queryParams : {}
        };
      })
    );
  }

  private setupObservables() {
    const { orgGuid, spaceGuid } = this.activeRouteCfOrgSpace;
    // V3-native org + space snapshots from the OrgDataService /
    // SpaceDataService signals. Each signal is empty until its request
    // returns, and the context below is taken once, so wait for the value:
    // otherwise a page opened by its address shows placeholders for names
    // the route has.
    const org$ = orgGuid && this.cfOrgService
      ? toObservable(this.cfOrgService.orgDataService.org, { injector: this.injector }).pipe(filter(org => !!org))
      : observableOf(null);
    const space$ = spaceGuid && this.cfSpaceService
      ? toObservable(this.cfSpaceService.spaceDataService.space, { injector: this.injector }).pipe(filter(space => !!space))
      : observableOf(null);
    this.endpointOrgSpace$ = combineLatest([
      this.cfEndpointService.endpoint$,
      org$,
      space$
    ]);

    this.context$ = this.endpointOrgSpace$.pipe(
      map(([cf, org, space]) => {
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
      }),
      take(1)
    );
  }

  private setupBreadcrumbs() {
    this.breadcrumbs$ = this.endpointOrgSpace$.pipe(
      map(([cf, org, space]) => {
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
      }),
      take(1)
    );
  }

  back() {
    // Direct Angular Router navigation, replacing the ngrx RouterNav dispatch
    // (the RouterEffect did exactly this: split a string path into segments
    // and pass query params through NavigationExtras).
    this.router.navigate(this.previousUrl.split('/'), { queryParams: this.previousQueryParams });
  }
}
