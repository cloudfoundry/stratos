import { Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { IUserRole } from '../../../../../features/cloud-foundry/cf.helpers';
import { AppState } from '../../../../../store/app-state';
import { selectSessionData } from '../../../../../store/reducers/auth.reducer';
import { APIResource } from '../../../../../store/types/api.types';
import { CfUser } from '../../../../../store/types/user.types';
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

export abstract class CfPermissionCell<T> extends TableCellCustom<APIResource<CfUser>>  {

  @Input('row')
  set row(row: APIResource<CfUser>) {
    this.rowSubject.next(row);
    this.guid = row.metadata.guid;
  }

  @Input('config')
  set config(config: any) {
    this.configSubject.next(config);
  }

  public chipsConfig$: Observable<AppChip<ICellPermissionList<T>>[]>;
  protected guid: string;

  protected rowSubject = new BehaviorSubject<APIResource<CfUser>>(null);
  protected configSubject = new BehaviorSubject<any>(null);

  constructor(public store: Store<AppState>, private confirmDialog: ConfirmationDialogService) {
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
      this.store.select(selectSessionData()).pipe(
        first()
      ).subscribe(sessionData => {
        const cfSession = sessionData.endpoints.cf[cellPermission.cfGuid];
        const updateConnectedUser = !cfSession.user.admin && cellPermission.userGuid === cfSession.user.guid;
        this.removePermission(cellPermission, updateConnectedUser);
      });
    });
  }

  protected removePermission(cellPermission: ICellPermissionList<T>, updateConnectedUser: boolean) {

  }

  protected canRemovePermission = (cfGuid: string, orgGuid: string, spaceGuid: string): Observable<boolean> => observableOf(false);
}
