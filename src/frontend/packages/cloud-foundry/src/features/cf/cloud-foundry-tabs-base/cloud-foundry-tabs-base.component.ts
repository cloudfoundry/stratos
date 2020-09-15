import { Component, OnInit } from '@angular/core';
import { Observable, of as observableOf } from 'rxjs';
import { first, map, startWith } from 'rxjs/operators';

import { EndpointsService } from '../../../../../core/src/core/endpoints.service';
import {
  getActionsFromExtensions,
  getTabsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
  StratosTabType,
} from '../../../../../core/src/core/extension/extension-service';
import { CurrentUserPermissionsService } from '../../../../../core/src/core/permissions/current-user-permissions.service';
import { environment } from '../../../../../core/src/environments/environment.prod';
import { IPageSideNavTab } from '../../../../../core/src/features/dashboard/page-side-nav/page-side-nav.component';
import { FavoritesConfigMapper } from '../../../../../store/src/favorite-config-mapper';
import { UserFavoriteEndpoint } from '../../../../../store/src/types/user-favorites.types';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cloud-foundry-tabs-base',
  templateUrl: './cloud-foundry-tabs-base.component.html',
  styleUrls: ['./cloud-foundry-tabs-base.component.scss']
})
export class CloudFoundryTabsBaseComponent implements OnInit {
  static firehose = 'firehose';
  static users = 'users';
  static cells = 'cells';

  public tabLinks: IPageSideNavTab[];

  // Used to hide tab that is not yet implemented when in production
  isDevEnvironment = !environment.production;

  isFetching$: Observable<boolean>;

  public canAddOrg$: Observable<boolean>;
  public tabsHeader = 'Cloud Foundry';
  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.CloudFoundry);

  public favorite$: Observable<UserFavoriteEndpoint>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    endpointsService: EndpointsService,
    favoritesConfigMapper: FavoritesConfigMapper
  ) {
    this.favorite$ = endpointsService.endpoints$.pipe(
      first(),
      map(endpoints => endpoints[this.cfEndpointService.cfGuid]),
      map(endpoint => favoritesConfigMapper.getFavoriteEndpointFromEntity(endpoint))
    );

    const firehoseHidden$ = this.currentUserPermissionsService
      .can(CfCurrentUserPermissions.FIREHOSE_VIEW, this.cfEndpointService.cfGuid)
      .pipe(map(visible => !visible));

    const usersHidden$ = cfEndpointService.usersCount$.pipe(
      map(count => !count),
      startWith(true),
    );

    const cellsHidden$ = EndpointsService.hasMetrics(cfEndpointService.cfGuid).pipe(
      map(hasMetrics => !hasMetrics)
    );
    // TODO: RC At the moment the cells side nave item will always show, even when eirini is configured.
    // We can change this with the below code, however that creates a flicker of cells nav item before it's removed
    // We can change this to not show at first... which would then move the flicker on to the diego cell's use case
    // const cellsHidden$ = endpointsService.eiriniMetricsProvider(cfEndpointService.cfGuid).pipe(
    //   switchMap(eiriniMetricsProvider => eiriniMetricsProvider ? of(false) : endpointsService.hasCellMetrics(cfEndpointService.cfGuid)),
    //   map(hasMetrics => !hasMetrics)
    // );

    // Default tabs + add any tabs from extensions
    this.tabLinks = [
      { link: 'summary', label: 'Summary', icon: 'cloud_foundry', iconFont: 'stratos-icons' },
      { link: 'organizations', label: 'Organizations', icon: 'organization', iconFont: 'stratos-icons' },
      {
        link: CloudFoundryTabsBaseComponent.cells,
        label: 'Cells',
        icon: 'select_all',
        hidden$: cellsHidden$
      },
      { link: 'routes', label: 'Routes', icon: 'route', iconFont: 'stratos-icons', },
      {
        link: CloudFoundryTabsBaseComponent.users,
        label: 'Users',
        hidden$: usersHidden$,
        icon: 'people'
      },
      {
        link: CloudFoundryTabsBaseComponent.firehose,
        label: 'Firehose',
        hidden$: firehoseHidden$,
        icon: 'featured_play_list'
      },
      { link: 'feature-flags', label: 'Feature Flags', icon: 'flag' },
      { link: 'build-packs', label: 'Build Packs', icon: 'build' },
      { link: 'stacks', label: 'Stacks', icon: 'code' },
      { link: 'security-groups', label: 'Security Groups', icon: 'security' },
      { link: 'quota-definitions', label: 'Organization Quotas', icon: 'data_usage' },
      { link: 'events', label: 'Events', icon: 'watch_later' },
      ...getTabsFromExtensions(StratosTabType.CloudFoundry)
    ];
  }

  ngOnInit() {
    this.isFetching$ = observableOf(false);
    this.canAddOrg$ = this.currentUserPermissionsService.can(CfCurrentUserPermissions.ORGANIZATION_CREATE, this.cfEndpointService.cfGuid);
  }

}
