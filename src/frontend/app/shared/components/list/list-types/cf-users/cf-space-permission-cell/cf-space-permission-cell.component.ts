import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { arrayHelper } from '../../../../../../core/helper-classes/array.helper';
import { getOrgRoles, getSpaceRoles, SpaceUserRoles } from '../../../../../../features/cloud-foundry/cf.helpers';
import { RemoveUserPermission } from '../../../../../../store/actions/users.actions';
import { AppState } from '../../../../../../store/app-state';
import { APIResource } from '../../../../../../store/types/api.types';
import { CfUser, IUserPermissionInOrg, IUserPermissionInSpace } from '../../../../../../store/types/user.types';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { EntityMonitor } from '../../../../../monitors/entity-monitor';
import { AppChip } from '../../../../chips/chips.component';
import { cfUserSchemaKey, entityFactory } from '../../../../../../store/helpers/entity-factory';
import { TableCellCfUserPermissionComponent, ICellPermissionList } from '../cf-user-permission-cell/cf-user-permission-cell.component';

interface ICellPermissionUpdates {
  [key: string]: Observable<boolean>;
}

@Component({
  selector: 'app-cf-space-permission-cell',
  templateUrl: './cf-space-permission-cell.component.html',
  styleUrls: ['./cf-space-permission-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CfSpacePermissionCellComponent extends TableCellCfUserPermissionComponent {

  constructor(
    public store: Store<AppState>,
    public cfUserService: CfUserService
  ) {
    super(store, cfUserService);
  }

  protected setChipConfig(row: APIResource<CfUser>) {
    const userRoles = this.cfUserService.getSpaceRolesFromUser(row.entity);
    const userOrgPermInfo = arrayHelper.flatten<ICellPermissionList<SpaceUserRoles>>(
      userRoles.map(spacePerms => this.getSpacePermissions(spacePerms, row))
    );
    this.chipsConfig = this.getChipConfig<SpaceUserRoles>(userOrgPermInfo);
  }

  private getSpacePermissions(spacePerms: IUserPermissionInSpace, row: APIResource<CfUser>) {
    return getSpaceRoles(spacePerms.permissions).map(perm => {
      const updatingKey = RemoveUserPermission.generateUpdatingKey<SpaceUserRoles>(
        spacePerms.orgGuid,
        perm.key,
        row.metadata.guid
      );
      return {
        ...perm,
        name: spacePerms.name,
        spaceId: spacePerms.orgGuid,
        busy: new EntityMonitor(
          this.store,
          row.metadata.guid,
          cfUserSchemaKey,
          entityFactory(cfUserSchemaKey)
        ).getUpdatingSection(updatingKey).pipe(
          map(update => update.busy)
          )
      };
    });
  }

}
