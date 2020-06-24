import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, of } from 'rxjs';
import { combineLatest, filter, first, map } from 'rxjs/operators';

import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { UsersRolesClear, UsersRolesExecuteChanges, UsersRolesSetUsers } from '../../../../actions/users-roles.actions';
import { CFAppState } from '../../../../cf-app-state';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { selectCfUsersRoles, selectCfUsersRolesPicked } from '../../../../store/selectors/cf-users-roles.selector';
import { CfUser } from '../../../../store/types/cf-user.types';
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
  setUsernames = false;
  title$: Observable<string>;

  constructor(
    private store: Store<CFAppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private cfUserService: CfUserService,
    private route: ActivatedRoute
  ) {

    this.defaultCancelUrl = this.createReturnUrl(activeRouteCfOrgSpace);

    // Setup the stepper with the users that will have their roles managed
    this.setUsernames = route.snapshot.queryParams.setByUsername;
    if (this.setUsernames) {
      // User has yet to supply users to manage. This will be handled by the first step
      this.singleUser$ = of(null);
    } else {
      const userQParam = this.route.snapshot.queryParams.user;
      if (userQParam) {
        this.initialUsers$ = this.cfUserService.getUser(activeRouteCfOrgSpace.cfGuid, userQParam).pipe(
          map(user => [user.entity]),
          first()
        );
      } else {
        this.initialUsers$ = this.store.select(selectCfUsersRolesPicked).pipe(first());
      }

      this.singleUser$ = this.initialUsers$.pipe(
        first(),
        filter(users => users && users.length > 0),
        map(users => users.length === 1 ? users[0] : null),
      );

      // Ensure that when we arrive here directly the store is set up with all it needs
      this.store.select(selectCfUsersRoles).pipe(
        combineLatest(this.initialUsers$),
        first()
      ).subscribe(([usersRoles, users]) => {
        if (!usersRoles.cfGuid || !users) {
          this.store.dispatch(new UsersRolesSetUsers(activeRouteCfOrgSpace.cfGuid, users));
        }
      });
    }

    this.title$ = this.singleUser$.pipe(
      map(singleUser => singleUser ? `Manage Roles: ${singleUser.username}` : `Manage User Roles`)
    );
  }

  ngOnDestroy(): void {
    this.store.dispatch(new UsersRolesClear());
  }

  /**
   * Determine where the return url should be. This will only apply when user visits modal directly (otherwise stepper uses previous state)
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
    this.store.dispatch(
      new UsersRolesExecuteChanges(this.setUsernames, this.activeRouteCfOrgSpace.orgGuid, this.activeRouteCfOrgSpace.spaceGuid)
    );
    return observableOf({ success: true, ignoreSuccess: true });
  }
}
