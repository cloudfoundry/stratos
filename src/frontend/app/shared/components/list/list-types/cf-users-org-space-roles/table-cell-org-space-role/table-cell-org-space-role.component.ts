import { Component } from '@angular/core';

import { ISpace } from '../../../../../../core/cf-api.types';
import { APIResource } from '../../../../../../store/types/api.types';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-org-space-role',
  templateUrl: './table-cell-org-space-role.component.html',
  styleUrls: ['./table-cell-org-space-role.component.scss']
})
export class TableCellRoleOrgSpaceComponent extends TableCellCustom<APIResource<ISpace>> { }
