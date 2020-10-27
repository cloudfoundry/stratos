import { Component } from '@angular/core';

import { CfRoleChangeWithNames } from '../../../../../../../../cloud-foundry/src/store/types/users-roles.types';
import { TableCellCustomComponent } from '../../../../../../../../core/src/shared/components/list/list.types';

@Component({
  selector: 'app-table-cell-confirm-role-add-rem',
  templateUrl: './table-cell-confirm-role-add-rem.component.html',
  styleUrls: ['./table-cell-confirm-role-add-rem.component.scss']
})
export class TableCellConfirmRoleAddRemComponent extends TableCellCustomComponent<CfRoleChangeWithNames> { }
