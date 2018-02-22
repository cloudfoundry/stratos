import { Component, OnInit } from '@angular/core';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { APIResource } from '../../../../../../store/types/api.types';
import { CfUser, UserSchema } from '../../../../../../store/types/user.types';
import { getOrgRolesString, getOrgRoles, IOrgUserRole } from '../../../../../../features/cloud-foundry/cf.helpers';
import { Observable } from 'rxjs/Observable';
import { EntityMonitor } from '../../../../../monitors/entity-monitor';
import { AppState } from '../../../../../../store/app-state';
import { Store } from '@ngrx/store';
import { RemoveUserPermission } from '../../../../../../store/actions/users.actions';
import { ActionState } from '../../../../../../store/reducers/api-request-reducer/types';
import { map } from 'rxjs/operators';

interface ICellPermissionList extends IOrgUserRole {
  busy: Observable<boolean>;
}

interface ICellPermission {
  orgId: string;
  orgName: string;
  permissions: ICellPermissionList[];
}

interface ICellPermissionUpdates {
  [key: string]: Observable<boolean>;
}

@Component({
  selector: 'app-cf-user-permission-cell',
  templateUrl: './cf-user-permission-cell.component.html',
  styleUrls: ['./cf-user-permission-cell.component.scss']
})
export class TableCellCfUserPermissionComponent implements OnInit {
  public userOrgPermInfo: ICellPermission[] = [];
  public row: APIResource<CfUser>;
  constructor(
    private store: Store<AppState>,
    private cfUserService: CfUserService
  ) { }

  ngOnInit() {
    const userRoles = this.cfUserService.getRolesFromUser(this.row.entity);
    this.userOrgPermInfo = userRoles
      .map(orgPerms => ({
        orgName: orgPerms.orgName,
        orgId: orgPerms.orgGuid,
        permissions: this.getOrgPermissions(orgPerms)
      }));
  }

  getOrgPermissions(orgPerms) {
    return getOrgRoles(orgPerms.permissions).map(perm => {
      const updatingKey = RemoveUserPermission.generateUpdatingKey(
        orgPerms.orgGuid,
        perm.key,
        this.row.metadata.guid
      );
      return {
        ...perm,
        busy: new EntityMonitor(
          this.store,
          this.row.metadata.guid,
          UserSchema.key,
          UserSchema
        ).getUpdatingSection(updatingKey).pipe(
          map(update => update.busy)
        )
      };
    });
  }

  public removePermission(cellPermission: ICellPermission, permission: IOrgUserRole) {
    this.store.dispatch(new RemoveUserPermission(
      this.row.metadata.guid,
      cellPermission.orgId,
      permission.key
    ));
  }
}
