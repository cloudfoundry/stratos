import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { EndpointsSignalService } from '@stratosui/core';
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
    const endpoints = inject(EndpointsSignalService);
    const cfRoles = inject(CfCurrentUserRolesSignalService);

    super(endpoints, cfRoles);
    this.init();
  }

}
