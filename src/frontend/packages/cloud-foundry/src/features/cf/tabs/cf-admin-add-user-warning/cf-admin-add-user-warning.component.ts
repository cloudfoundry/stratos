import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

import { GetAllCfUsersAsAdmin } from '../../../../actions/users.actions';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { CfCurrentUserRolesSignalService } from '../../../../user-permissions/cf-current-user-roles-signal.service';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { waitForCFPermissions } from '../../cf.helpers';

@Component({
  selector: 'app-cf-admin-add-user-warning',
  templateUrl: './cf-admin-add-user-warning.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule
  ]
})
export class CfAdminAddUserWarningComponent {

  isOrg: boolean;
  show$: Observable<boolean>;

  constructor() {
    const cfRoles = inject(CfCurrentUserRolesSignalService);
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
    const cfUserService = inject(CfUserService);

    this.isOrg = !activeRouteCfOrgSpace.spaceGuid;
    this.show$ = waitForCFPermissions(
      cfRoles,
      activeRouteCfOrgSpace.cfGuid
    ).pipe(
      filter(cf => cf.global.isAdmin),
      switchMap(cf => cfUserService.createPaginationAction(
        cf.global.isAdmin,
        activeRouteCfOrgSpace.cfGuid,
        activeRouteCfOrgSpace.orgGuid,
        activeRouteCfOrgSpace.spaceGuid)),
      map(fetchUsersAction => {
        return !GetAllCfUsersAsAdmin.is(fetchUsersAction);
      })
    );
  }

}
