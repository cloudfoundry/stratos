import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@stratosui/store';

import { CFAppState } from '../../../../../../cf-app-state';
import { CfCurrentUserRolesSignalService } from '../../../../../../user-permissions/cf-current-user-roles-signal.service';
import { TableCellAppCfOrgSpaceBase } from '../TableCellAppCfOrgSpaceBase';

@Component({
  selector: 'app-table-cell-app-cforgspace-header',
  templateUrl: './table-cell-app-cforgspace-header.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule
  ]
})
export class TableCellAppCfOrgSpaceHeaderComponent extends TableCellAppCfOrgSpaceBase {

  constructor() {
    const store = inject<Store<CFAppState>>(Store);
    const cfRoles = inject(CfCurrentUserRolesSignalService);

    super(store, cfRoles);
    this.init();
  }

}
