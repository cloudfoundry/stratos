import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../../../environments/environment';
import { CurrentUserPermissions } from '../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../core/current-user-permissions.service';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { AppState } from './../../../store/app-state';

@Component({
  selector: 'app-cloud-foundry-tabs-base',
  templateUrl: './cloud-foundry-tabs-base.component.html',
  styleUrls: ['./cloud-foundry-tabs-base.component.scss']
})

export class CloudFoundryTabsBaseComponent implements OnInit {
  tabLinks = [
    { link: 'summary', label: 'Summary' },
    { link: 'organizations', label: 'Organizations' },
    { link: 'users', label: 'Users' },
    { link: 'firehose', label: 'Firehose' },
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

  }

  ngOnInit() {
    this.isFetching$ = Observable.of(false);
    this.canAddOrg$ = this.currentUserPermissionsService.can(CurrentUserPermissions.ORGANIZATION_CREATE, this.cfEndpointService.cfGuid);
  }
}
