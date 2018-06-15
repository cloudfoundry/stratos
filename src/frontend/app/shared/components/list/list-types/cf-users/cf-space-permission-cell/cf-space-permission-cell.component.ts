import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, of as observableOf } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { ISpace } from '../../../../../../core/cf-api.types';
import { CurrentUserPermissions } from '../../../../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../core/current-user-permissions.service';
import { arrayHelper } from '../../../../../../core/helper-classes/array.helper';
import { getSpaceRoles } from '../../../../../../features/cloud-foundry/cf.helpers';
import { RemoveUserPermission } from '../../../../../../store/actions/users.actions';
import { AppState } from '../../../../../../store/app-state';
import { entityFactory, spaceSchemaKey } from '../../../../../../store/helpers/entity-factory';
import { APIResource, EntityInfo } from '../../../../../../store/types/api.types';
import { CfUser, IUserPermissionInSpace, SpaceUserRoleNames } from '../../../../../../store/types/user.types';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { EntityMonitor } from '../../../../../monitors/entity-monitor';
import { AppChip } from '../../../../chips/chips.component';
import { ConfirmationDialogService } from '../../../../confirmation-dialog.service';
import { CfPermissionCell, ICellPermissionList } from '../cf-permission-cell';


@Component({
  selector: 'app-cf-space-permission-cell',
  templateUrl: './cf-space-permission-cell.component.html',
  styleUrls: ['./cf-space-permission-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CfSpacePermissionCellComponent extends CfPermissionCell<SpaceUserRoleNames> {

  constructor(
    public store: Store<AppState>,
    public cfUserService: CfUserService,
    private userPerms: CurrentUserPermissionsService,
    confirmDialog: ConfirmationDialogService
  ) {
    super(confirmDialog);
    this.chipsConfig$ = combineLatest(
      this.rowSubject.asObservable(),
      this.configSubject.asObservable().pipe(switchMap(config => config.spaces$))
    ).pipe(
      map(([user, spaces]: [APIResource<CfUser>, APIResource<ISpace>[]]) =>
        this.setChipConfig(user, spaces && spaces.length ? spaces : null)
      )
    );
  }

  private setChipConfig(row: APIResource<CfUser>, spaces: APIResource<ISpace>[]): AppChip<ICellPermissionList<SpaceUserRoleNames>>[] {
    const userRoles = this.cfUserService.getSpaceRolesFromUser(row.entity, spaces);
    const userPermInfo = arrayHelper.flatten<ICellPermissionList<SpaceUserRoleNames>>(
      userRoles.map(spacePerms => this.getSpacePermissions(spacePerms, row))
    );
    return this.getChipConfig(userPermInfo);
  }

  private getSpacePermissions(spacePerms: IUserPermissionInSpace, row: APIResource<CfUser>) {
    return getSpaceRoles(spacePerms.permissions).map(perm => {
      const updatingKey = RemoveUserPermission.generateUpdatingKey(
        perm.key,
        row.metadata.guid
      );
      return {
        ...perm,
        name: spacePerms.name,
        guid: spacePerms.spaceGuid,
        userGuid: row.metadata.guid,
        busy: new EntityMonitor(
          this.store,
          spacePerms.spaceGuid,
          spaceSchemaKey,
          entityFactory(spaceSchemaKey)
        ).getUpdatingSection(updatingKey).pipe(
          map(update => update.busy)
        ),
        cfGuid: row.entity.cfGuid,
        orgGuid: spacePerms.orgGuid,
        spaceGuid: spacePerms.spaceGuid
      };
    });
  }

  public removePermission(cellPermission: ICellPermissionList<SpaceUserRoleNames>) {
    this.store.dispatch(new RemoveUserPermission(
      this.cfUserService.activeRouteCfOrgSpace.cfGuid,
      cellPermission.userGuid,
      cellPermission.guid,
      cellPermission.key,
      true
    ));
  }

  public canRemovePermission = (cfGuid: string, orgGuid: string, spaceGuid: string) =>
    this.userPerms.can(CurrentUserPermissions.SPACE_CHANGE_ROLES, cfGuid, orgGuid, spaceGuid)
}
