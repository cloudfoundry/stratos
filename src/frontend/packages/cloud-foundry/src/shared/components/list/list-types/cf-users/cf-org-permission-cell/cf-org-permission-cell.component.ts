import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, of as observableOf } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { AppChip, AppChipsComponent, arrayHelper, ConfirmationDialogService, CurrentUserPermissionsService } from '@stratosui/core';
import { APIResource, entityCatalog } from '@stratosui/store';
import { RemoveCfUserRole } from '../../../../../../actions/users.actions';
import { CFAppState } from '../../../../../../cf-app-state';
import { organizationEntityType } from '../../../../../../cf-entity-types';
import { IOrganization } from '../../../../../../cf-api.types';
import { CF_ENDPOINT_TYPE } from '../../../../../../cf-types';
import { getOrgRoles } from '../../../../../../features/cf/cf.helpers';
import { CfUser, IUserPermissionInOrg, OrgUserRoleNames } from '../../../../../../store/types/cf-user.types';
import { CfCurrentUserPermissions } from '../../../../../../user-permissions/cf-user-permissions-checkers';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { CfPermissionCellDirective, ICellPermissionList } from '../cf-permission-cell';

@Component({
  selector: 'app-org-user-permission-cell',
  templateUrl: './cf-org-permission-cell.component.html',
  styleUrls: ['./cf-org-permission-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    AppChipsComponent
  ]
})
export class CfOrgPermissionCellComponent extends CfPermissionCellDirective<OrgUserRoleNames> {

  constructor(
    public store: Store<CFAppState>,
    cfUserService: CfUserService,
    private userPerms: CurrentUserPermissionsService,
    confirmDialog: ConfirmationDialogService,
  ) {
    super(store, confirmDialog, cfUserService);
    this.chipsConfig$ = combineLatest([
      this.rowSubject.asObservable(),
      this.config$.pipe(switchMap(config => config.org$ || observableOf(null)))
    ]).pipe(
      map(([user, org]: [APIResource<CfUser>, APIResource<IOrganization>]) => this.setChipConfig(user, org))
    );
  }

  private setChipConfig(row: APIResource<CfUser>, org?: APIResource<IOrganization>): AppChip<ICellPermissionList<OrgUserRoleNames>>[] {
    const userRoles = this.cfUserService.getOrgRolesFromUser(row.entity, org);
    const userOrgPermInfo = arrayHelper.flatten<ICellPermissionList<OrgUserRoleNames>>(
      userRoles.map(orgPerms => this.getOrgPermissions(orgPerms, row, !org))
    );
    return this.getChipConfig(userOrgPermInfo);
  }

  private getOrgPermissions(
    orgPerms: IUserPermissionInOrg,
    row: APIResource<CfUser>,
    showName: boolean): ICellPermissionList<OrgUserRoleNames>[] {
    return getOrgRoles(orgPerms.permissions).map(perm => {
      const updatingKey = RemoveCfUserRole.generateUpdatingKey(
        perm.key,
        row.metadata.guid
      );
      const catalogEntity = entityCatalog.getEntity({
        entityType: organizationEntityType,
        endpointType: CF_ENDPOINT_TYPE
      });
      return {
        ...perm,
        name: showName ? orgPerms.name : null,
        guid: orgPerms.orgGuid,
        username: row.entity.username,
        userGuid: row.metadata.guid,
        busy: catalogEntity.store.getEntityMonitor(
          orgPerms.orgGuid
        )
          .getUpdatingSection(updatingKey).pipe(
            map(update => update.busy)
          ),
        cfGuid: row.entity.cfGuid,
        orgGuid: orgPerms.orgGuid
      };
    });
  }

  public removePermission(cellPermission: ICellPermissionList<OrgUserRoleNames>, updateConnectedUser: boolean) {
    this.store.dispatch(new RemoveCfUserRole(
      this.cfUserService.activeRouteCfOrgSpace.cfGuid,
      cellPermission.userGuid,
      cellPermission.guid,
      cellPermission.key,
      false,
      updateConnectedUser
    ));
  }

  public canRemovePermission = (cfGuid: string, orgGuid: string, spaceGuid: string) =>
    this.userPerms.can(CfCurrentUserPermissions.ORGANIZATION_CHANGE_ROLES, cfGuid, orgGuid);

}
