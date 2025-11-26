import { Component, Input , ChangeDetectionStrategy } from '@angular/core';

import type { CfRoleChangeWithNames } from '../../../../../../../../cloud-foundry/src/store/types/users-roles.types';
import { AppChip, AppChipsComponent } from '@stratosui/core';
import { TableCellCustom } from '@stratosui/core';

@Component({
  selector: 'app-table-cell-confirm-org-space',
  templateUrl: './table-cell-confirm-org-space.component.html',
  styleUrls: ['./table-cell-confirm-org-space.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppChipsComponent
  ]
})
export class TableCellConfirmOrgSpaceComponent extends TableCellCustom<CfRoleChangeWithNames> {
  chipsConfig!: AppChip<CfRoleChangeWithNames>[];
  @Input('row')
  set row(row: CfRoleChangeWithNames) {
    super.row = row;
    const chipConfig = new AppChip<CfRoleChangeWithNames>();
    chipConfig.key = row;
    chipConfig.value = row.spaceGuid ? `Space: ${row.spaceName}` : `Org: ${row.orgName}`;
    this.chipsConfig = [chipConfig];
  }
}
