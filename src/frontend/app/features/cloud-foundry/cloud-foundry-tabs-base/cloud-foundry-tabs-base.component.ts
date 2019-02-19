import { Component, OnInit } from '@angular/core';
import { Observable, of as observableOf } from 'rxjs';
import { map, startWith, first } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { CurrentUserPermissions } from '../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../core/current-user-permissions.service';
import { EndpointsService } from '../../../core/endpoints.service';
import {
  getActionsFromExtensions,
  getTabsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
  StratosTabType,
} from '../../../core/extension/extension-service';
import { ISubHeaderTabs } from '../../../shared/components/page-subheader/page-subheader.types';
import { UserFavoriteEndpoint } from '../../../store/types/user-favorites.types';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { canUpdateOrgSpaceRoles } from '../cf.helpers';

@Component({
  selector: 'app-cloud-foundry-tabs-base',
  templateUrl: './cloud-foundry-tabs-base.component.html',
  styleUrls: ['./cloud-foundry-tabs-base.component.scss']
})
export class CloudFoundryTabsBaseComponent implements OnInit {
  static firehose = 'firehose';
  static users = 'users';
  static cells = 'cells';

  public tabLinks: ISubHeaderTabs[];

  // Used to hide tab that is not yet implemented when in production
  isDevEnvironment = !environment.production;

  isFetching$: Observable<boolean>;

  public canUpdateRoles$: Observable<boolean>;

  public tabsHeader = 'Cloud Foundry';

  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.CloudFoundry);

  public favorite$: Observable<UserFavoriteEndpoint>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    endpointsService: EndpointsService
  ) {

    this.favorite$ = endpointsService.endpoints$.pipe(
      first(),
      map(endpoints => endpoints[this.cfEndpointService.cfGuid]),
      map(endpoint => new UserFavoriteEndpoint(
        this.cfEndpointService.cfGuid,
        'cf',
        endpoint
      ))
    );

    const firehoseHidden$ = this.currentUserPermissionsService
      .can(CurrentUserPermissions.FIREHOSE_VIEW, this.cfEndpointService.cfGuid)
      .pipe(map(visible => !visible));

    const usersHidden$ = cfEndpointService.usersCount$.pipe(
      map(count => !count),
      startWith(true),
    );

    const cellsHidden$ = endpointsService.hasMetrics(cfEndpointService.cfGuid).pipe(
      map(hasMetrics => !hasMetrics)
    );

    // Default tabs + add any tabs from extensions
    this.tabLinks = [
      { link: 'summary', label: 'Summary', matIcon: 'description' },
      { link: 'organizations', label: 'Organizations', matIcon: 'organization', matIconFont: 'stratos-icons' },
      {
        link: CloudFoundryTabsBaseComponent.cells,
        label: 'Cells',
        hidden: cellsHidden$
      },
      { link: 'routes', label: 'Routes' },
      {
        link: CloudFoundryTabsBaseComponent.users,
        label: 'Users',
        hidden: usersHidden$,
        matIcon: 'people'
      },
      {
        link: CloudFoundryTabsBaseComponent.firehose,
        label: 'Firehose',
        hidden: firehoseHidden$,
        matIcon: 'featured_play_list'
      },
      { link: 'feature-flags', label: 'Feature Flags', matIcon: 'flag' },
      { link: 'build-packs', label: 'Build Packs', matIcon: 'build' },
      { link: 'stacks', label: 'Stacks', matIcon: 'code' },
      { link: 'security-groups', label: 'Security Groups', matIcon: 'security' }
    ].concat(getTabsFromExtensions(StratosTabType.CloudFoundry));
  }

  ngOnInit() {
    this.isFetching$ = observableOf(false);
  }

}
