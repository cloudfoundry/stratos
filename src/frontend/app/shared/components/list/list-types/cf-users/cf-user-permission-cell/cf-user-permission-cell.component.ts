import { Component, OnInit } from '@angular/core';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { APIResource } from '../../../../../../store/types/api.types';
import { CfUser } from '../../../../../../store/types/user.types';
import { getOrgRolesString, getOrgRoles, IOrgUserRole } from '../../../../../../features/cloud-foundry/cf.helpers';
import { Observable } from 'rxjs/Observable';
import { EntityMonitor } from '../../../../../monitors/entity-monitor';
import { AppState } from '../../../../../../store/app-state';
import { Store } from '@ngrx/store';
import { RemoveUserPermission } from '../../../../../../store/actions/users.actions';
interface ICellPermission {
  orgId: string;
  orgName: string;
  permissions: IOrgUserRole[];
}
@Component({
  selector: 'app-cf-user-permission-cell',
  templateUrl: './cf-user-permission-cell.component.html',
  styleUrls: ['./cf-user-permission-cell.component.scss']
})
export class TableCellCfUserPermissionComponent implements OnInit {
  public userPermInfo: ICellPermission[] = [];
  public permissionUpdates: Observable<boolean>[];
  public row: APIResource<CfUser>;
  constructor(
    private store: Store<AppState>,
    private cfUserService: CfUserService
  ) { }

  ngOnInit() {
    const userRoles = this.cfUserService.getRolesFromUser(this.row.entity);
    this.userPermInfo = userRoles
      .map(orgPerms => ({
        orgName: orgPerms.orgName,
        orgId: orgPerms.orgGuid,
        permissionKey: orgPerms.permissions,
        permissions: getOrgRoles(orgPerms.permissions)
      }));
    // this.permissionUpdates = this.permissions.map(perms => {
    //   return new EntityMonitor().getUpdatingSection();
    // })
  }

  public removePermission(cellPermission: ICellPermission, permission: IOrgUserRole) {
    this.store.dispatch(new RemoveUserPermission(
      this.row.metadata.guid,
      cellPermission.orgId,
      permission.key
    ));
  }


}
