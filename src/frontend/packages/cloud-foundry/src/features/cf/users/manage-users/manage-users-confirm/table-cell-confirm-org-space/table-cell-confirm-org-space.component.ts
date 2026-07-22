import { Component, Input , ChangeDetectionStrategy } from '@angular/core';

import { CfRoleChangeWithNames } from '../../../../../../../../cloud-foundry/src/store/types/users-roles.types';
import { AppChip, AppChipsComponent } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/signal-list/cell-base';

@Component({
  selector: 'app-table-cell-confirm-org-space',
  templateUrl: './table-cell-confirm-org-space.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppChipsComponent
  ]
})
export class TableCellConfirmOrgSpaceComponent extends TableCellCustom<CfRoleChangeWithNames> {
  chipsConfig!: AppChip[];
  @Input()
  set row(row: CfRoleChangeWithNames) {
    super.row = row;
    // key is only used by app-chips as a track identity; the single chip's
    // value is unique here, so the default (string) key type suffices.
    const chipConfig = new AppChip();
    chipConfig.value = row.spaceGuid ? `Space: ${row.spaceName}` : `Org: ${row.orgName}`;
    this.chipsConfig = [chipConfig];
  }
}
