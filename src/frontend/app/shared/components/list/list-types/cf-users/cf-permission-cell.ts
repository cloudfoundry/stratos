import { Input } from '@angular/core';
import { Observable, of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';

import { IUserRole } from '../../../../../features/cloud-foundry/cf.helpers';
import { APIResource } from '../../../../../store/types/api.types';
import { CfUser } from '../../../../../store/types/user.types';
import { AppChip } from '../../../chips/chips.component';
import { TableCellCustom } from '../../list.types';


export interface ICellPermissionList<T> extends IUserRole<T> {
  busy: Observable<boolean>;
  name: string;
  guid: string;
  userGuid: string;
  cfGuid: string;
  orgGuid: string;
  spaceGuid?: string;
}

interface ICellPermissionUpdates {
  [key: string]: Observable<boolean>;
}

export abstract class CfPermissionCell<T> extends TableCellCustom<APIResource<CfUser>> {
  @Input('row')
  set row(row: APIResource<CfUser>) {
    this.setChipConfig(row);
    this.guid = row.metadata.guid;
  }
  public chipsConfig: AppChip<ICellPermissionList<T>>[];
  protected guid: string;

  protected setChipConfig(user: APIResource<CfUser>) {

  }

  protected getChipConfig(cellPermissionList: ICellPermissionList<T>[]) {
    return cellPermissionList.map(perm => {
      const chipConfig = new AppChip<ICellPermissionList<T>>();
      chipConfig.key = perm;
      chipConfig.value = `${perm.name}: ${perm.string}`;
      chipConfig.busy = perm.busy;
      chipConfig.clearAction = chip => {
        const permission = chip.key;
        this.removePermission(permission);
      };
      chipConfig.hideClearButton$ = this.canRemovePermission(perm.cfGuid, perm.orgGuid, perm.spaceGuid).pipe(
        map(can => !can),
      );
      return chipConfig;
    });
  }

  protected removePermission(cellPermission: ICellPermissionList<T>) {

  }

  protected canRemovePermission = (cfGuid: string, orgGuid: string, spaceGuid: string): Observable<boolean> => observableOf(false);
}
