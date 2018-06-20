import { Input } from '@angular/core';
import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

import { IUserRole } from '../../../../../features/cloud-foundry/cf.helpers';
import { APIResource } from '../../../../../store/types/api.types';
import { CfUser } from '../../../../../store/types/user.types';
import { UserRoleLabels } from '../../../../../store/types/users-roles.types';
import { CfUserService } from '../../../../data-services/cf-user.service';
import { AppChip } from '../../../chips/chips.component';
import { ConfirmationDialogConfig } from '../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { TableCellCustom } from '../../list.types';


export interface ICellPermissionList<T> extends IUserRole<T> {
  busy: Observable<boolean>;
  name: string;
  guid: string;
  userGuid: string;
  userName?: string;
  cfGuid: string;
  orgGuid: string;
  spaceGuid?: string;
}

interface ICellPermissionUpdates {
  [key: string]: Observable<boolean>;
}

export abstract class CfPermissionCell<T> extends TableCellCustom<APIResource<CfUser>> {
  userEntity: BehaviorSubject<CfUser> = new BehaviorSubject(null);

  @Input('row')
  set row(row: APIResource<CfUser>) {
    this.rowSubject.next(row);
    this.guid = row.metadata.guid;
    this.userEntity.next(row.entity);
  }

  @Input('config')
  set config(config: any) {
    this.configSubject.next(config);
  }

  public chipsConfig$: Observable<AppChip<ICellPermissionList<T>>[]>;
  protected guid: string;

  protected rowSubject = new BehaviorSubject<APIResource<CfUser>>(null);
  protected configSubject = new BehaviorSubject<any>(null);

  constructor(
    private confirmDialog: ConfirmationDialogService,
    public cfUserService: CfUserService
  ) {
    super();
  }

  protected getChipConfig(cellPermissionList: ICellPermissionList<T>[]) {
    return cellPermissionList.map(perm => {
      const chipConfig = new AppChip<ICellPermissionList<T>>();
      chipConfig.key = perm;
      chipConfig.value = `${perm.name}: ${perm.string}`;
      chipConfig.busy = perm.busy;
      chipConfig.clearAction = chip => {
        const permission = chip.key;
        this.removePermissionWarn(permission);
      };
      chipConfig.hideClearButton$ = this.canRemovePermission(perm.cfGuid, perm.orgGuid, perm.spaceGuid).pipe(
        map(can => !can),
        switchMap(can => {
          if (!can) {
            if (perm.string === UserRoleLabels.org.short.users) {
              // If there are other roles than Org User, disable clear button
              return this.userEntity.pipe(
                filter(p => !!p),
                map((entity: CfUser) => this.cfUserService.hasRolesInOrg(entity, perm.orgGuid)),
              );
            }
          }
          return observableOf(can);
        })
      );
      return chipConfig;
    });
  }

  protected removePermissionWarn(cellPermission: ICellPermissionList<T>) {
    const confirmation = new ConfirmationDialogConfig(
      'Remove Permission',
      `Are you sure you want to remove permission '${cellPermission.name}: ${cellPermission.string}'` +
      ` from user '${cellPermission.userName}'?`,
      'Delete',
      true
    );
    this.confirmDialog.open(confirmation, () => {
      this.removePermission(cellPermission);
    });
  }

  protected removePermission(cellPermission: ICellPermissionList<T>) {

  }

  protected canRemovePermission = (cfGuid: string, orgGuid: string, spaceGuid: string): Observable<boolean> => observableOf(false);
}
