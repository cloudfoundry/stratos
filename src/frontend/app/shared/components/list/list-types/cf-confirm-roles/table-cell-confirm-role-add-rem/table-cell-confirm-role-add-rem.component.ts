import { Component } from '@angular/core';

import { CfRoleChangeWithNames } from '../../../../../../store/types/users-roles.types';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-confirm-role-add-rem',
  templateUrl: './table-cell-confirm-role-add-rem.component.html',
  styleUrls: ['./table-cell-confirm-role-add-rem.component.scss']
})
export class TableCellConfirmRoleAddRemComponent extends TableCellCustom<CfRoleChangeWithNames> { }
