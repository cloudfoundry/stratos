import { Component } from '@angular/core';

import { TableCellCustom } from '../../../list.types';
import { CfRoleChangeWithNames } from '../../../../../../../../store/src/types/users-roles.types';

@Component({
  selector: 'app-table-cell-confirm-role-add-rem',
  templateUrl: './table-cell-confirm-role-add-rem.component.html',
  styleUrls: ['./table-cell-confirm-role-add-rem.component.scss']
})
export class TableCellConfirmRoleAddRemComponent extends TableCellCustom<CfRoleChangeWithNames> { }
