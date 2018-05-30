
import {of as observableOf,  Observable } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { environment } from '../../../../environments/environment';
import { CurrentUserPermissions } from '../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../core/current-user-permissions.service';
import { ISubHeaderTabs } from '../../../shared/components/page-subheader/page-subheader.types';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { AppState } from './../../../store/app-state';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-cloud-foundry-tabs-base',
  templateUrl: './cloud-foundry-tabs-base.component.html',
  styleUrls: ['./cloud-foundry-tabs-base.component.scss']
})
export class CloudFoundryTabsBaseComponent implements OnInit {
  static firehose = 'firehose';

  tabLinks: ISubHeaderTabs[] = [
    { link: 'summary', label: 'Summary' },
    { link: 'organizations', label: 'Organizations' },
    { link: 'users', label: 'Users' },
    { link: CloudFoundryTabsBaseComponent.firehose, label: 'Firehose' },
    { link: 'feature-flags', label: 'Feature Flags' },
    { link: 'build-packs', label: 'Build Packs' },
    { link: 'stacks', label: 'Stacks' },
    { link: 'security-groups', label: 'Security Groups' }
  ];

  // Used to hide tab that is not yet implemented when in production
  isDevEnvironment = !environment.production;

  isFetching$: Observable<boolean>;

  public canAddOrg$: Observable<boolean>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    private store: Store<AppState>,
    public currentUserPermissionsService: CurrentUserPermissionsService
  ) {
    this.tabLinks.find(tabLink => tabLink.link === CloudFoundryTabsBaseComponent.firehose).hidden =
      this.currentUserPermissionsService.can(CurrentUserPermissions.FIREHOSE_VIEW, this.cfEndpointService.cfGuid).pipe(
        map(visible => !visible)
      );
  }

  ngOnInit() {
    this.isFetching$ = observableOf(false);
    this.canAddOrg$ = this.currentUserPermissionsService.can(CurrentUserPermissions.ORGANIZATION_CREATE, this.cfEndpointService.cfGuid);

  }
}
