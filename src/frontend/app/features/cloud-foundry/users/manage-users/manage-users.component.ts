import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, first, map, withLatestFrom } from 'rxjs/operators';

import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { UsersRolesClear, UsersRolesSetUsers } from '../../../../store/actions/users-roles.actions';
import { AppState } from '../../../../store/app-state';
import { selectUsersRoles, selectUsersRolesPicked } from '../../../../store/selectors/users-roles.selector';
import { CfUser } from '../../../../store/types/user.types';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';

@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
  ]
})
export class UsersRolesComponent implements OnDestroy {
  initialUsers$: Observable<CfUser[]>;
  singleUser$: Observable<CfUser>;
  defaultCancelUrl: string;

  constructor(
    private store: Store<AppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private cfUserService: CfUserService
  ) {

    this.defaultCancelUrl = this.createReturnUrl(activeRouteCfOrgSpace);

    this.initialUsers$ = this.store.select(selectUsersRolesPicked).pipe(
      first(),
    );

    this.singleUser$ = this.initialUsers$.pipe(
      filter(users => users && users.length > 0),
      map(users => users.length === 1 ? users[0] : {} as CfUser),
    );

    // Ensure that when we arrive here directly the store is set up with all it needs
    this.store.select(selectUsersRoles).pipe(
      withLatestFrom(this.initialUsers$),
      first()
    ).subscribe(([usersRoles, users]) => {
      if (!usersRoles.cfGuid) {
        this.store.dispatch(new UsersRolesSetUsers(activeRouteCfOrgSpace.cfGuid, users));
      }
    });

  }

  ngOnDestroy(): void {
    console.log('DESTROYING');
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
}
