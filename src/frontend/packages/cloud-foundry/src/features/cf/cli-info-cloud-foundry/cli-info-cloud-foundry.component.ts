import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, Injector, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

import { CustomTooltipDirective } from '@stratosui/core';
import { Store } from '@stratosui/store';
import { BehaviorSubject, combineLatest, Observable, of as observableOf } from 'rxjs';
import { take, map } from 'rxjs/operators';

import { PageHeaderComponent } from '../../../../../core/src/shared/components/page-header/page-header.component';
import { IHeaderBreadcrumb } from '../../../../../core/src/shared/components/page-header/page-header.types';
import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { getFullEndpointApiUrl } from '../../../../../store/src/endpoint-utils';
import { EntityInfo } from '../../../../../store/src/types/api.types';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { getPreviousRoutingState } from '../../../../../store/src/types/routing.type';
import { StOrgDetail, StSpace } from '../../../services/endpoint-data/stratos-types';
import { CFAppState } from '../../../cf-app-state';
import { CliCommandComponent } from '../../../shared/components/cli-info/cli-command/cli-command.component';
import { CFAppCLIInfoContext, CliInfoComponent } from '../../../shared/components/cli-info/cli-info.component';
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
  private store = inject<Store<CFAppState>>(Store);
  activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private cfEndpointService = inject(CloudFoundryEndpointService);
  private cfOrgService = inject(CloudFoundryOrganizationService, { optional: true });
  private cfSpaceService = inject(CloudFoundrySpaceService, { optional: true });
  private injector = inject(Injector);


  permsOrgEdit = CfCurrentUserPermissions.ORGANIZATION_EDIT;
  permsSpaceEdit = CfCurrentUserPermissions.SPACE_EDIT;

  orgGuid!: string;
  spaceGuid!: string;

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
    const activeRouteCfOrgSpace = this.activeRouteCfOrgSpace;

    this.breadcrumbs$ = new BehaviorSubject<IHeaderBreadcrumb[]>([]);
    if (activeRouteCfOrgSpace.orgGuid) {
      this.orgGuid = activeRouteCfOrgSpace.orgGuid;
      this.spaceGuid = activeRouteCfOrgSpace.spaceGuid || CfUserPermissionsChecker.ALL_SPACES;
    }
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
          url: route && route.state ? route.state.url : defaultBackLink,
          queryParams: route && route.state && route.state.queryParams ? route.state.queryParams : {}
        };
      })
    );
  }

  private setupObservables() {
    const { orgGuid, spaceGuid } = this.activeRouteCfOrgSpace;
    // V3-native org + space snapshots from the OrgDataService /
    // SpaceDataService signals.
    const org$ = orgGuid && this.cfOrgService
      ? toObservable(this.cfOrgService.orgDataService.org, { injector: this.injector })
      : observableOf(null);
    const space$ = spaceGuid && this.cfSpaceService
      ? toObservable(this.cfSpaceService.spaceDataService.space, { injector: this.injector })
      : observableOf(null);
    this.endpointOrgSpace$ = combineLatest(
      this.cfEndpointService.endpoint$,
      org$,
      space$
    );

    this.context$ = this.endpointOrgSpace$.pipe(
      map(([cf, org, space]) => {
        return {
          orgName: org ? org.name : null,
          spaceName: space ? space.name : null,
          apiEndpoint: getFullEndpointApiUrl(cf.entity),
          username: cf.entity.user ? cf.entity.user.name : ''
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
    this.store.dispatch(new RouterNav({
      path: this.previousUrl,
      query: this.previousQueryParams
    }
    ));
  }
}
