import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IApp, ISpace } from '../../../../../../cf-api.types';
import { TableCellAppCfOrgSpaceBase } from '../TableCellAppCfOrgSpaceBase';

@Component({
  selector: 'app-table-cell-app-cforgspace',
  templateUrl: './table-cell-app-cforgspace.component.html',
  styleUrls: ['./table-cell-app-cforgspace.component.scss'],
})
export class TableCellAppCfOrgSpaceComponent extends TableCellAppCfOrgSpaceBase {

  @Input('row')
  set row(row: APIResource<IApp>) {
    if (row) {
      this.init(row.entity.cfGuid, (row.entity.space as APIResource<ISpace>).entity.organization_guid, row.entity.space_guid);
    }
  }

  constructor(store: Store<CFAppState>) {
    super(store);
  }

}
