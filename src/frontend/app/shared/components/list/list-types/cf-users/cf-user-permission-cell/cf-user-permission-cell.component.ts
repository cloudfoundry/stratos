import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { arrayHelper } from '../../../../../../core/helper-classes/array.helper';
import { getOrgRoles, OrgUserRoles, IUserRole, SpaceUserRoles } from '../../../../../../features/cloud-foundry/cf.helpers';
import { RemoveUserPermission } from '../../../../../../store/actions/users.actions';
import { AppState } from '../../../../../../store/app-state';
import { APIResource } from '../../../../../../store/types/api.types';
import { CfUser, IUserPermissionInOrg } from '../../../../../../store/types/user.types';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { EntityMonitor } from '../../../../../monitors/entity-monitor';
import { IAppChip, AppChip } from '../../../../chips/chips.component';
import { cfUserSchemaKey, entityFactory } from '../../../../../../store/helpers/entity-factory';
import { TableCellCustom } from '../../../list.types';

export interface ICellPermissionList<T> extends IUserRole<T> {
  busy: Observable<boolean>;
  name: string;
  id: string;
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
export class
  TableCellCfUserPermissionComponent extends TableCellCustom<APIResource<CfUser>> {
  @Input('row')
  set row(row: APIResource<CfUser>) {
    this.setChipConfig(row);
    this.guid = row.metadata.guid;
  }
  public chipsConfig: AppChip<ICellPermissionList<OrgUserRoles | SpaceUserRoles>>[];
  private guid: string;
  constructor(
    public store: Store<AppState>,
    public cfUserService: CfUserService
  ) {
    super();
  }

  protected setChipConfig(row: APIResource<CfUser>) {
    const userRoles = this.cfUserService.getOrgRolesFromUser(row.entity);
    const userOrgPermInfo = arrayHelper.flatten<ICellPermissionList<OrgUserRoles>>(
      userRoles.map(orgPerms => this.getOrgPermissions(orgPerms, row))
    );
    this.chipsConfig = this.getChipConfig<OrgUserRoles>(userOrgPermInfo);
  }

  protected getChipConfig<T>(cellPermissionList: ICellPermissionList<T>[]) {
    return cellPermissionList.map(perm => {
      const chipConfig = new AppChip<ICellPermissionList<T>>();
      chipConfig.key = perm;
      chipConfig.value = `${perm.name}: ${perm.key}`;
      chipConfig.busy = perm.busy;
      chipConfig.clearAction = chip => {
        const permission = chip.key;
        this.removePermission(permission);
      };
      // Disable removal of role, since we can't add any
      chipConfig.hideClearButton = true;
      return chipConfig;
    });
  }

  private getOrgPermissions(orgPerms: IUserPermissionInOrg, row: APIResource<CfUser>) {
    return getOrgRoles(orgPerms.permissions).map(perm => {
      const updatingKey = RemoveUserPermission.generateUpdatingKey(
        orgPerms.orgGuid,
        perm.key,
        row.metadata.guid
      );
      return {
        ...perm,
        name: orgPerms.name,
        orgId: orgPerms.orgGuid,
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

  public removePermission<T>(cellPermission: ICellPermissionList<T>) {
    this.store.dispatch(new RemoveUserPermission(
      this.guid,
      cellPermission.id,
      cellPermission.key
    ));
  }
}
