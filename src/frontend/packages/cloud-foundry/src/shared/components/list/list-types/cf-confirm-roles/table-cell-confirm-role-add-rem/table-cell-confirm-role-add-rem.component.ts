import { Component , ChangeDetectionStrategy } from '@angular/core';

import { BooleanIndicatorComponent } from '@stratosui/core';
import type { CfRoleChangeWithNames } from '../../../../../../../../cloud-foundry/src/store/types/users-roles.types';
import { TableCellCustom } from '@stratosui/core';

@Component({
  selector: 'app-table-cell-confirm-role-add-rem',
  templateUrl: './table-cell-confirm-role-add-rem.component.html',
  styleUrls: ['./table-cell-confirm-role-add-rem.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BooleanIndicatorComponent
  ]
})
export class TableCellConfirmRoleAddRemComponent extends TableCellCustom<CfRoleChangeWithNames> { }
