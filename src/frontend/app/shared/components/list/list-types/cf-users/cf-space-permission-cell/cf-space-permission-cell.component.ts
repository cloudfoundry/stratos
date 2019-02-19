import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

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

  missingRoles$: Observable<boolean>;

  constructor(
    public store: Store<AppState>,
    cfUserService: CfUserService,
    private userPerms: CurrentUserPermissionsService,
    confirmDialog: ConfirmationDialogService
  ) {
    super(store, confirmDialog, cfUserService);

    const spaces$: Observable<APIResource<ISpace>[]> = this.config$.pipe(switchMap(config => config.spaces$));
    const isOrgLevel$: Observable<boolean> = this.config$.pipe(map(config => config.isOrgLevel));
    this.chipsConfig$ = combineLatest(
      this.rowSubject.asObservable(),
      this.config$.pipe(switchMap(config => config.org$)),
      spaces$,
      isOrgLevel$
    ).pipe(
      switchMap(([user, org, spaces, isOrgLevel]: [APIResource<CfUser>, APIResource<IOrganization>, APIResource<ISpace>[], boolean]) => {
        const permissionList = this.createPermissions(user, isOrgLevel, spaces);
        // If we're showing spaces from multiple orgs prefix the org name to the space name
        return org ? observableOf(this.getChipConfig(permissionList)) : this.prefixOrgName(permissionList);
      })
    );

    this.missingRoles$ = isOrgLevel$.pipe(
      // If we're at the space level (we have the space) we don't need to show the missing warning
      switchMap(isOrgLevel => isOrgLevel ? this.createMissingRoles(spaces$) : observableOf(null))
    );
  }

  private createMissingRoles(spaces$: Observable<APIResource<ISpace>[]>): Observable<boolean> {
    return spaces$.pipe(
      // Switch to using the user entity
      switchMap(() => this.userEntity),
      map(user => user.missingRoles || { space: [] }),
      map(missingRoles => missingRoles.space ? !!missingRoles.space.length : false),
      filter(areMissingRoles => !!areMissingRoles),
    );
  }

  private prefixOrgName(permissionList: ICellPermissionList<SpaceUserRoleNames>[]) {
    // Find all unique org guids
    const orgGuids = permissionList.map(permission => permission.orgGuid).filter((value, index, self) => self.indexOf(value) === index);
    // Find names of all orgs
    const orgNames$ = orgGuids.length ? combineLatest(
      orgGuids.map(orgGuid => this.store.select<APIResource<IOrganization>>(selectEntity(organizationSchemaKey, orgGuid)).pipe(first()))
    ).pipe(
      filter(org => !!org),
      first(),
      map((orgs: APIResource<IOrganization>[]) => {
        const orgNames: { [orgGuid: string]: string } = {};
        orgs.forEach(org => {
          orgNames[org.metadata.guid] = org.entity.name;
        });
        return orgNames;
      })
    ) : observableOf([]);
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

  private createPermissions(row: APIResource<CfUser>, isOrgLevel = true, spaces?: APIResource<ISpace>[])
    : ICellPermissionList<SpaceUserRoleNames>[] {
    const userRoles = this.cfUserService.getSpaceRolesFromUser(row.entity, spaces);
    return arrayHelper.flatten<ICellPermissionList<SpaceUserRoleNames>>(
      userRoles.map(spacePerms => this.getSpacePermissions(spacePerms, row, isOrgLevel))
    );
  }

  private getSpacePermissions(spacePerms: IUserPermissionInSpace, row: APIResource<CfUser>, isOrgLevel = true) {
    return getSpaceRoles(spacePerms.permissions).map(perm => {
      const updatingKey = RemoveUserRole.generateUpdatingKey(
        perm.key,
        row.metadata.guid
      );
      return {
        ...perm,
        name: isOrgLevel ? spacePerms.name : '',
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
      updateConnectedUser,
      cellPermission.orgGuid
    ));
  }

  public canRemovePermission = (cfGuid: string, orgGuid: string, spaceGuid: string) =>
    this.userPerms.can(CurrentUserPermissions.SPACE_CHANGE_ROLES, cfGuid, orgGuid, spaceGuid)
}
