import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { arrayHelper } from '../../../../../../core/helper-classes/array.helper';
import { getOrgRoles, IOrgUserRole } from '../../../../../../features/cloud-foundry/cf.helpers';
import { RemoveUserPermission } from '../../../../../../store/actions/users.actions';
import { AppState } from '../../../../../../store/app-state';
import { APIResource } from '../../../../../../store/types/api.types';
import { CfUser, IUserPermissionInOrg, UserSchema } from '../../../../../../store/types/user.types';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { EntityMonitor } from '../../../../../monitors/entity-monitor';

interface ICellPermissionList extends IOrgUserRole {
  busy: Observable<boolean>;
  orgName: string;
  orgId: string;
}

interface ICellPermissionUpdates {
  [key: string]: Observable<boolean>;
}

@Component({
  selector: 'app-cf-user-permission-cell',
  templateUrl: './cf-user-permission-cell.component.html',
  styleUrls: ['./cf-user-permission-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableCellCfUserPermissionComponent {
  @Input('row')
  set row(row: APIResource<CfUser>) {
    this.setPermissions(row);
    this.guid = row.metadata.guid;
  }
  public atLowerLimit = true;
  private lowerLimit = 3;
  private upperLimit = 1000;
  public limit = this.lowerLimit;
  private guid: string;
  public userOrgPermInfo: ICellPermissionList[] = [];
  constructor(
    private store: Store<AppState>,
    private cfUserService: CfUserService
  ) { }

  private setPermissions(row: APIResource<CfUser>) {
    const userRoles = this.cfUserService.getRolesFromUser(row.entity);
    this.userOrgPermInfo = arrayHelper.flatten(
      userRoles.map(orgPerms => this.getOrgPermissions(orgPerms, row))
    );
  }

  getOrgPermissions(orgPerms: IUserPermissionInOrg, row: APIResource<CfUser>) {
    return getOrgRoles(orgPerms.permissions).map(perm => {
      const updatingKey = RemoveUserPermission.generateUpdatingKey(
        orgPerms.orgGuid,
        perm.key,
        row.metadata.guid
      );
      return {
        ...perm,
        orgName: orgPerms.orgName,
        orgId: orgPerms.orgGuid,
        busy: new EntityMonitor(
          this.store,
          row.metadata.guid,
          UserSchema.key,
          UserSchema
        ).getUpdatingSection(updatingKey).pipe(
          map(update => update.busy)
        )
      };
    });
  }

  public removePermission(cellPermission: ICellPermissionList) {
    this.store.dispatch(new RemoveUserPermission(
      this.guid,
      cellPermission.orgId,
      cellPermission.key
    ));
  }

  public toggleLimit() {
    if (this.limit === this.lowerLimit) {
      this.limit = this.upperLimit;
      this.atLowerLimit = false;
    } else {
      this.limit = this.lowerLimit;
      this.atLowerLimit = true;
    }
  }
}
