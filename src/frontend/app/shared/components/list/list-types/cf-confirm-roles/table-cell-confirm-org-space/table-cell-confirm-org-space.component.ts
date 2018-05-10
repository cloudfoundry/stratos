import { Component } from '@angular/core';

import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-confirm-org-space',
  templateUrl: './table-cell-confirm-org-space.component.html',
  styleUrls: ['./table-cell-confirm-org-space.component.scss']
})
export class TableCellConfirmOrgSpaceComponent<CfRoleChangeWithNames> extends TableCellCustom<CfRoleChangeWithNames> { }
