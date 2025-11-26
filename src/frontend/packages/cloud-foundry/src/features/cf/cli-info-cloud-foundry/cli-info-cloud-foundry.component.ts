import { CommonModule, AsyncPipe } from '@angular/common';
import { Component, type OnInit, Optional , ChangeDetectionStrategy } from '@angular/core';

import { CustomTooltipDirective } from '@stratosui/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, type Observable, of as observableOf } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { PageHeaderComponent, type IHeaderBreadcrumb } from '@stratosui/core';
import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { getFullEndpointApiUrl } from '../../../../../store/src/endpoint-utils';
import type { APIResource, EntityInfo } from '../../../../../store/src/types/api.types';
import type { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { getPreviousRoutingState } from '../../../../../store/src/types/routing.type';
import type { IOrganization, ISpace } from '../../../cf-api.types';
import { CliCommandComponent } from '../../../shared/components/cli-info/cli-command/cli-command.component';
import { type CFAppCLIInfoContext, CliInfoComponent } from '../../../shared/components/cli-info/cli-info.component';
import { CfUserPermissionDirective } from '../../../shared/directives/cf-user-permission/cf-user-permission.directive';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../shared/services/cloud-foundry-user-provided-services.service';
import { CfCurrentUserPermissions, CfUserPermissionsChecker } from '../../../user-permissions/cf-user-permissions-checkers';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../services/cloud-foundry-space.service';


@Component({
  selector: 'app-cli-info-cloud-foundry',
  templateUrl: './cli-info-cloud-foundry.component.html',
  styleUrls: ['./cli-info-cloud-foundry.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CustomTooltipDirective,
    PageHeaderComponent,
    CliInfoComponent,
    CliCommandComponent,
    CfUserPermissionDirective
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

  permsOrgEdit = CfCurrentUserPermissions.ORGANIZATION_EDIT;
  permsSpaceEdit = CfCurrentUserPermissions.SPACE_EDIT;

  orgGuid!: string;
  spaceGuid!: string;

  cfEndpointEntityService!: CloudFoundryEndpointService;
  public previousUrl!: string;
  public previousQueryParams!: Record<string, string>;

  public context$!: Observable<CFAppCLIInfoContext>;
  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;
  public route$!: Observable<{ url: string, queryParams: Record<string, unknown> }>;

  public endpointOrgSpace$!: Observable<[
    EntityInfo<EndpointModel>,
    EntityInfo<APIResource<IOrganization>>,
    EntityInfo<APIResource<ISpace>>
  ]>;

  constructor(
    private store: Store,
    public activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private cfEndpointService: CloudFoundryEndpointService,
    @Optional() private cfOrgService: CloudFoundryOrganizationService,
    @Optional() private cfSpaceService: CloudFoundrySpaceService
  ) {
    this.breadcrumbs$ = new BehaviorSubject<IHeaderBreadcrumb[]>([]);
    if (activeRouteCfOrgSpace.orgGuid) {
      this.orgGuid = activeRouteCfOrgSpace.orgGuid;
      this.spaceGuid = activeRouteCfOrgSpace.spaceGuid || CfUserPermissionsChecker.ALL_SPACES;
    }
  }

  ngOnInit() {
    this.setupRouteObservable(this.getDefaultBackLink());
    // Will auto unsubscribe as we are using 'first'
    this.route$.pipe(first()).subscribe(route => {
      this.previousUrl = route.url;
      this.previousQueryParams = route.queryParams as Record<string, string>;
    });

    this.setupObservables();
    this.setupBreadcrumbs();
  }

  private getDefaultBackLink(): string {
    const { cfGuid, orgGuid, spaceGuid } = this.activeRouteCfOrgSpace;
    let backLink = `/cloud-foundry/${cfGuid}`;
    if (orgGuid) {
      backLink = `${backLink}/${orgGuid}`;
      if (spaceGuid) {
        backLink = `${backLink}/${spaceGuid}`;
      }
    }
    return backLink;
  }

  private setupRouteObservable(defaultBackLink: string) {
    this.route$ = this.store.select(getPreviousRoutingState).pipe(
      map(route => {
        return {
          url: route?.state ? route.state.url : defaultBackLink,
          queryParams: route?.state?.queryParams ? route.state.queryParams : {}
        };
      })
    );
  }

  private setupObservables() {
    const { orgGuid, spaceGuid } = this.activeRouteCfOrgSpace;
    const org$ = orgGuid ? this.cfOrgService.org$ : observableOf(null);
    const space$ = spaceGuid ? this.cfSpaceService.space$ : observableOf(null);
    this.endpointOrgSpace$ = combineLatest(
      this.cfEndpointService.endpoint$,
      org$,
      space$
    );

    this.context$ = this.endpointOrgSpace$.pipe(
      map(([cf, org, space]) => {
        return {
          orgName: org ? org.entity.entity.name : null,
          spaceName: space ? space.entity.entity.name : null,
          apiEndpoint: getFullEndpointApiUrl(cf.entity),
          username: cf.entity.user ? cf.entity.user.name : ''
        };
      }),
      first()
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
            value: org.entity.entity.name,
            routerLink: `/cloud-foundry/${cf.entity.guid}/organizations/${org.entity.metadata.guid}`
          });
          if (space) {
            breadcrumbs.push({
              value: space.entity.entity.name,
              routerLink: `/cloud-foundry/${cf.entity.guid}/organizations/${org.entity.metadata.guid}/spaces/${space.entity.metadata.guid}`
            });
          }
        }
        return [{ breadcrumbs }];
      }),
      first()
    );
  }

  back() {
    this.store.dispatch(new RouterNav({
      path: this.previousUrl,
      query: this.previousQueryParams
    }
    ));
  }
}
