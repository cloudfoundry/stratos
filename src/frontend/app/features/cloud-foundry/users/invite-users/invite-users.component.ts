import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { of as observableOf } from 'rxjs';

import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { UsersRolesExecuteChanges } from '../../../../store/actions/users-roles.actions';
import { AppState } from '../../../../store/app-state';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';

@Component({
  selector: 'app-invite-users',
  templateUrl: './invite-users.component.html',
  styleUrls: ['./invite-users.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ]
})
export class InviteUsersComponent implements OnInit {

  defaultCancelUrl: string;
  applyStarted = true;

  constructor(
    private store: Store<AppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private cfUserService: CfUserService,
    private route: ActivatedRoute) {
    this.defaultCancelUrl = this.createReturnUrl(activeRouteCfOrgSpace);

  }

  ngOnInit() {
  }

  createReturnUrl(activeRouteCfOrgSpace: ActiveRouteCfOrgSpace): string {
    let route = `/cloud-foundry/${activeRouteCfOrgSpace.cfGuid}`;
    if (this.activeRouteCfOrgSpace.orgGuid) {
      route += `/organizations/${activeRouteCfOrgSpace.orgGuid}`;
      if (this.activeRouteCfOrgSpace.spaceGuid) {
        route += `/spaces/${activeRouteCfOrgSpace.spaceGuid}`;
      }
    }
    route += `/users`;
    return route;
  }

  startApply: StepOnNextFunction = () => {
    if (this.applyStarted) {
      return observableOf({ success: true, redirect: true });
    }
    this.applyStarted = true;
    this.store.dispatch(new UsersRolesExecuteChanges());
    return observableOf({ success: true, ignoreSuccess: true });
  }
}
