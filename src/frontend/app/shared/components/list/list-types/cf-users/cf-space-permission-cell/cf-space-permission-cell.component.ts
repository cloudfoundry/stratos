import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, of as observableOf } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { IOrganization, ISpace } from '../../../../../../core/cf-api.types';
import { CurrentUserPermissions } from '../../../../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../core/current-user-permissions.service';
import { arrayHelper } from '../../../../../../core/helper-classes/array.helper';
import { getSpaceRoles } from '../../../../../../features/cloud-foundry/cf.helpers';
import { RemoveUserRole } from '../../../../../../store/actions/users.actions';
import { AppState } from '../../../../../../store/app-state';
import { entityFactory, organizationSchemaKey, spaceSchemaKey } from '../../../../../../store/helpers/entity-factory';
import { selectEntity } from '../../../../../../store/selectors/api.selectors';
import { APIResource } from '../../../../../../store/types/api.types';
import { CfUser, IUserPermissionInSpace, SpaceUserRoleNames } from '../../../../../../store/types/user.types';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { EntityMonitor } from '../../../../../monitors/entity-monitor';
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
    cfUserService: CfUserService,
    private userPerms: CurrentUserPermissionsService,
    confirmDialog: ConfirmationDialogService
  ) {
    super(store, confirmDialog, cfUserService);
    this.chipsConfig$ = combineLatest(
      this.rowSubject.asObservable(),
      this.configSubject.asObservable().pipe(switchMap(config => config.org$)),
      this.configSubject.asObservable().pipe(switchMap(config => config.spaces$))
    ).pipe(
      switchMap(([user, org, spaces]: [APIResource<CfUser>, APIResource<IOrganization>, APIResource<ISpace>[]]) => {
        const permissionList = this.createPermissions(user, spaces && spaces.length ? spaces : null);
        // If we're showing spaces from multiple orgs prefix the org name to the space name
        return org ? observableOf(this.getChipConfig(permissionList)) : this.prefixOrgName(permissionList);
      })
    );
  }

  private prefixOrgName(permissionList) {
    // Find all unique org guids
    const orgGuids = permissionList.map(permission => permission.orgGuid).filter((value, index, self) => self.indexOf(value) === index);
    // Find names of all orgs
    const orgNames$ = combineLatest(
      orgGuids.map(orgGuid => this.store.select<APIResource<IOrganization>>(selectEntity(organizationSchemaKey, orgGuid)))
    ).pipe(
      map((orgs: APIResource<IOrganization>[]) => {
        const orgNames: { [orgGuid: string]: string } = {};
        orgs.forEach(org => {
          orgNames[org.metadata.guid] = org.entity.name;
        });
        return orgNames;
      })
    );
    return combineLatest(
      observableOf(permissionList),
      orgNames$
    ).pipe(
      map(([permissions, orgNames]) => {
        // Prefix permission name with org name
        permissions.forEach(permission => {
          permission.name = `${orgNames[permission.orgGuid]}: ${permission.name}`;
        });
        return this.getChipConfig(permissions);
      })
    );
  }

  private createPermissions(row: APIResource<CfUser>, spaces: APIResource<ISpace>[]): ICellPermissionList<SpaceUserRoleNames>[] {
    const userRoles = this.cfUserService.getSpaceRolesFromUser(row.entity, spaces);
    return arrayHelper.flatten<ICellPermissionList<SpaceUserRoleNames>>(
      userRoles.map(spacePerms => this.getSpacePermissions(spacePerms, row))
    );
  }

  private getSpacePermissions(spacePerms: IUserPermissionInSpace, row: APIResource<CfUser>) {
    return getSpaceRoles(spacePerms.permissions).map(perm => {
      const updatingKey = RemoveUserRole.generateUpdatingKey(
        perm.key,
        row.metadata.guid
      );
      return {
        ...perm,
        name: spacePerms.name,
        guid: spacePerms.spaceGuid,
        userName: row.entity.username,
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

  public removePermission(cellPermission: ICellPermissionList<SpaceUserRoleNames>, updateConnectedUser: boolean) {
    this.store.dispatch(new RemoveUserRole(
      this.cfUserService.activeRouteCfOrgSpace.cfGuid,
      cellPermission.userGuid,
      cellPermission.guid,
      cellPermission.key,
      true,
      updateConnectedUser
    ));
  }

  public canRemovePermission = (cfGuid: string, orgGuid: string, spaceGuid: string) =>
    this.userPerms.can(CurrentUserPermissions.SPACE_CHANGE_ROLES, cfGuid, orgGuid, spaceGuid)
}
