import { Component, OnInit, ChangeDetectionStrategy, computed, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  EndpointsService,
  getActionsFromExtensions,
  getTabsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
  StratosTabType,
  CurrentUserPermissionsService,
  environment,
  IPageSideNavTab,
  PageHeaderComponent,
  PageSubNavComponent,
  LoadingPageComponent
} from '@stratosui/core';
import { UserFavoriteEndpoint, UserFavoriteManager } from '@stratosui/store';

import { CfCliMenuComponent } from '../../../shared/components/cli-menu/cf-cli-menu.component';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cloud-foundry-tabs-base',
  templateUrl: './cloud-foundry-tabs-base.component.html',
  host: { class: 'flex flex-col flex-1 min-h-0 overflow-hidden' },
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    PageSubNavComponent,
    LoadingPageComponent,
    CfCliMenuComponent,
  ]
})
export class CloudFoundryTabsBaseComponent implements OnInit {
  cfEndpointService = inject(CloudFoundryEndpointService);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);

  static firehose = 'firehose';
  static users = 'users';
  static cells = 'cells';

  public tabLinks: IPageSideNavTab[];

  // Used to hide tab that is not yet implemented when in production
  isDevEnvironment = !environment.production;

  isFetching$!: Observable<boolean>;

  public tabsHeader = 'Cloud Foundry';
  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.CloudFoundry);

  // null when the endpoint has no cnsi_type/guid (getFavoriteEndpointFromEntity).
  public favorite: Signal<UserFavoriteEndpoint | null>;

  constructor() {
    const cfEndpointService = this.cfEndpointService;
    const endpointsService = inject(EndpointsService);
    const userFavoriteManager = inject(UserFavoriteManager);

    this.favorite = computed(() =>
      userFavoriteManager.getFavoriteEndpointFromEntity(endpointsService.endpoints()[this.cfEndpointService.cfGuid])
    );

    // Hidden until the roles load (the check reads false until then).
    const canViewFirehose = this.currentUserPermissionsService
      .can(CfCurrentUserPermissions.FIREHOSE_VIEW, this.cfEndpointService.cfGuid);
    const firehoseHidden = computed(() => !canViewFirehose());

    const usersHidden = computed(() => !cfEndpointService.usersCount());

    // hasMetrics() is a stream; null until it answers.
    const cellsHidden = toSignal(endpointsService.hasMetrics(cfEndpointService.cfGuid).pipe(
      map(hasMetrics => !hasMetrics)
    ), { initialValue: null });

    // Default tabs + add any tabs from extensions
    this.tabLinks = [
      { link: 'summary', label: 'Summary', icon: 'cloud_foundry', iconFont: 'stratos-icons' },
      { link: 'organizations', label: 'Organizations', icon: 'organization', iconFont: 'stratos-icons' },
      { link: 'applications', label: 'Applications', icon: 'apps' },
      { link: 'marketplace', label: 'Marketplace', icon: 'store' },
      { link: 'services', label: 'Services', icon: 'service', iconFont: 'stratos-icons' },
      {
        link: CloudFoundryTabsBaseComponent.cells,
        label: 'Cells',
        icon: 'select_all',
        isHidden: cellsHidden
      },
      { link: 'routes', label: 'Routes', icon: 'route', iconFont: 'stratos-icons', },
      {
        link: CloudFoundryTabsBaseComponent.users,
        label: 'Users',
        isHidden: usersHidden,
        icon: 'people'
      },
      {
        link: CloudFoundryTabsBaseComponent.firehose,
        label: 'Firehose',
        isHidden: firehoseHidden,
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
  }

}
