import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@stratosui/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { take, filter, map, switchMap } from 'rxjs/operators';

import { AppChipsComponent, arrayHelper, ConfirmationDialogService, CurrentUserPermissionsService } from '@stratosui/core';
import { APIResource, entityCatalog } from '@stratosui/store';
import {
  CFAppState,
  CF_ENDPOINT_TYPE,
  CfCurrentUserPermissions,
  CfUser,
  getSpaceRoles,
  IOrganization,
  ISpace,
  IUserPermissionInSpace,
  organizationEntityType,
  RemoveCfUserRole,
  selectCfEntity,
  spaceEntityType,
  SpaceUserRoleNames
} from '@stratosui/cloud-foundry';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { CfPermissionCellDirective, ICellPermissionList } from '../cf-permission-cell';

@Component({
  selector: 'app-cf-space-permission-cell',
  templateUrl: './cf-space-permission-cell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    AppChipsComponent
  ]
})
export class CfSpacePermissionCellComponent extends CfPermissionCellDirective<SpaceUserRoleNames> {
  store: Store<CFAppState>;
  private userPerms = inject(CurrentUserPermissionsService);


  missingRoles$: Observable<boolean | null>;

  constructor() {
    const store = inject<Store<CFAppState>>(Store);
    const cfUserService = inject(CfUserService);
    const confirmDialog = inject(ConfirmationDialogService);

    super();
    this.store = store;


    const spaces$: Observable<APIResource<ISpace>[]> = this.config$.pipe(
      switchMap(config => (config.spaces$ || observableOf([])) as Observable<APIResource<ISpace>[]>)
    );
    const isOrgLevel$: Observable<boolean> = this.config$.pipe(map(config => config.isOrgLevel));
    this.chipsConfig$ = combineLatest([
      this.rowSubject.asObservable(),
      this.config$.pipe(switchMap(config => config.org$ || observableOf<APIResource<IOrganization> | null>(null))),
      spaces$,
      isOrgLevel$,
    ]).pipe(
      switchMap(([user, org, spaces, isOrgLevel]: [APIResource<CfUser>, APIResource<IOrganization> | null, APIResource<ISpace>[], boolean]) => {
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
      map(user => user.missingRoles || { space: [] as any[] }),
      map(missingRoles => missingRoles.space ? !!missingRoles.space.length : false),
      filter(areMissingRoles => !!areMissingRoles),
    );
  }

  private prefixOrgName(permissionList: ICellPermissionList<SpaceUserRoleNames>[]): Observable<any> {
    // Find all unique org guids
    const orgGuids = permissionList.map(permission => permission.orgGuid).filter((value, index, self) => self.indexOf(value) === index);
    // Find names of all orgs
    const orgNames$ = orgGuids.length ? combineLatest(
      orgGuids.map(orgGuid => this.store.select<APIResource<IOrganization>>(selectCfEntity(organizationEntityType, orgGuid)).pipe(take(1)))
    ).pipe(
      filter(org => !!org),
      take(1),
      map((orgs: APIResource<IOrganization>[]) => {
        const orgNames: { [orgGuid: string]: string } = {};
        orgs.forEach(org => {
          orgNames[org.metadata.guid] = org.entity.name;
        });
        return orgNames;
      })
    ) : observableOf({});
    return combineLatest(
      observableOf(permissionList),
      orgNames$
    ).pipe(
      map(([permissions, orgNames]: [ICellPermissionList<SpaceUserRoleNames>[], { [key: string]: string }]) => {
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
      const updatingKey = RemoveCfUserRole.generateUpdatingKey(
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
    this.store.dispatch(new RemoveCfUserRole(
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
    this.userPerms.can(CfCurrentUserPermissions.SPACE_CHANGE_ROLES, cfGuid, orgGuid, spaceGuid);
}
