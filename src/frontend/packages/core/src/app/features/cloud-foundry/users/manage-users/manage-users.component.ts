
import { of as observableOf, Observable } from 'rxjs';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, filter, first, map, tap, startWith } from 'rxjs/operators';

import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import {
  UsersRolesClear,
  UsersRolesExecuteChanges,
  UsersRolesSetUsers,
} from '../../../../store/actions/users-roles.actions';
import { AppState } from '../../../../store/app-state';
import { selectUsersRoles, selectUsersRolesPicked } from '../../../../store/selectors/users-roles.selector';
import { CfUser } from '../../../../store/types/user.types';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { CfRolesService } from './cf-roles.service';

@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CfUserService,
    CfRolesService
  ]
})
export class UsersRolesComponent implements OnDestroy {
  initialUsers$: Observable<CfUser[]>;
  singleUser$: Observable<CfUser>;
  defaultCancelUrl: string;
  applyStarted = false;

  constructor(
    private store: Store<AppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private cfUserService: CfUserService,
    private route: ActivatedRoute
  ) {

    this.defaultCancelUrl = this.createReturnUrl(activeRouteCfOrgSpace);

    const userQParam = this.route.snapshot.queryParams.user;
    if (userQParam) {
      this.initialUsers$ = this.cfUserService.getUser(activeRouteCfOrgSpace.cfGuid, userQParam).pipe(
        map(user => [user.entity]),
        first()
      );
    } else {
      this.initialUsers$ = this.store.select(selectUsersRolesPicked).pipe(first());
    }

    this.singleUser$ = this.initialUsers$.pipe(
      first(),
      filter(users => users && users.length > 0),
      map(users => users.length === 1 ? users[0] : null),
    );

    // Ensure that when we arrive here directly the store is set up with all it needs
    this.store.select(selectUsersRoles).pipe(
      combineLatest(this.initialUsers$),
      first()
    ).subscribe(([usersRoles, users]) => {
      if (!usersRoles.cfGuid || !users) {
        this.store.dispatch(new UsersRolesSetUsers(activeRouteCfOrgSpace.cfGuid, users));
      }
    });

  }

  ngOnDestroy(): void {
    this.store.dispatch(new UsersRolesClear());
  }

  /**
   * Determine where the return url should be. This will only apply when user visits modal directly (otherwise stepper uses previous state)
   *
   * @param {ActiveRouteCfOrgSpace} activeRouteCfOrgSpace
   * @returns {Observable<string>}
   * @memberof UsersRolesComponent
   */
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
