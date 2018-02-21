import { Component, OnInit } from '@angular/core';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { APIResource } from '../../../../../../store/types/api.types';
import { CfUser } from '../../../../../../store/types/user.types';
import { getOrgRolesString } from '../../../../../../features/cloud-foundry/cf.helpers';

@Component({
  selector: 'app-cf-user-permission-cell',
  templateUrl: './cf-user-permission-cell.component.html',
  styleUrls: ['./cf-user-permission-cell.component.scss']
})
export class TableCellCfUserPermissionComponent implements OnInit {
  permissions: {
    orgId: string,
    orgName: string,
    permissionString: string
  }[] = [];
  row: APIResource<CfUser>;
  constructor(private cfUserService: CfUserService) { }

  ngOnInit() {
    const userRoles = this.cfUserService.getRolesFromUser(this.row.entity);
    this.permissions = userRoles
      .map(orgPerms => ({
        orgName: orgPerms.orgName,
        orgId: orgPerms.orgGuid,
        permissionString: getOrgRolesString(orgPerms.permissions)
      }));
  }


}
