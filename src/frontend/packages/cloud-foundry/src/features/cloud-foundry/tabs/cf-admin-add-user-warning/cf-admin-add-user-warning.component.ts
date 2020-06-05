import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

import { GetAllCfUsersAsAdmin } from '../../../../../../cloud-foundry/src/actions/users.actions';
import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { waitForCFPermissions } from '../../cf.helpers';

@Component({
  selector: 'app-cf-admin-add-user-warning',
  templateUrl: './cf-admin-add-user-warning.component.html',
  styleUrls: ['./cf-admin-add-user-warning.component.scss']
})
export class CfAdminAddUserWarningComponent {

  isOrg: boolean;
  show$: Observable<boolean>;

  constructor(
    store: Store<CFAppState>,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    cfUserService: CfUserService
  ) {
    this.isOrg = !activeRouteCfOrgSpace.spaceGuid;
    this.show$ = waitForCFPermissions(
      store,
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
