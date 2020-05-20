import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import { RemoveUserRole } from '../../../../../../../../cloud-foundry/src/actions/users.actions';
import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { organizationEntityType, spaceEntityType } from '../../../../../../../../cloud-foundry/src/cf-entity-types';
import { selectCfEntity } from '../../../../../../../../cloud-foundry/src/store/selectors/api.selectors';
import {
  CfUser,
  IUserPermissionInSpace,
  SpaceUserRoleNames,
} from '../../../../../../../../cloud-foundry/src/store/types/user.types';
import { CurrentUserPermissions } from '../../../../../../../../core/src/core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../../../core/src/core/current-user-permissions.service';
import { arrayHelper } from '../../../../../../../../core/src/core/helper-classes/array.helper';
import { ConfirmationDialogService } from '../../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { entityCatalog } from '../../../../../../../../store/src/entity-catalog/entity-catalog';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IOrganization, ISpace } from '../../../../../../cf-api.types';
import { CF_ENDPOINT_TYPE } from '../../../../../../cf-types';
import { getSpaceRoles } from '../../../../../../features/cloud-foundry/cf.helpers';
import { CfUserService } from '../../../../../data-services/cf-user.service';
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
    public store: Store<CFAppState>,
    cfUserService: CfUserService,
    private userPerms: CurrentUserPermissionsService,
    confirmDialog: ConfirmationDialogService,
  ) {
    super(store, confirmDialog, cfUserService);

    const spaces$: Observable<APIResource<ISpace>[]> = this.config$.pipe(
      switchMap(config => config.spaces$ as Observable<APIResource<ISpace>[]>)
    );
    const isOrgLevel$: Observable<boolean> = this.config$.pipe(map(config => config.isOrgLevel));
    this.chipsConfig$ = combineLatest(
      this.rowSubject.asObservable(),
      this.config$.pipe(switchMap(config => config.org$)),
      spaces$,
      isOrgLevel$,
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
      orgGuids.map(orgGuid => this.store.select<APIResource<IOrganization>>(selectCfEntity(organizationEntityType, orgGuid)).pipe(first()))
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
      const catalogEntity = entityCatalog.getEntity({
        entityType: spaceEntityType,
        endpointType: CF_ENDPOINT_TYPE
      });
      return {
        ...perm,
        name: isOrgLevel ? spacePerms.name : '',
        guid: spacePerms.spaceGuid,
        username: row.entity.username,
        userGuid: row.metadata.guid,
        busy: catalogEntity.store.getEntityMonitor(
          spacePerms.spaceGuid
        )
          .getUpdatingSection(updatingKey).pipe(
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
