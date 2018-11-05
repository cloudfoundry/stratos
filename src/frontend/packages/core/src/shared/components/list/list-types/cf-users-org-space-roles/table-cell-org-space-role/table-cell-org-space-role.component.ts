import { Component } from '@angular/core';

import { ISpace } from '../../../../../../core/cf-api.types';
import { TableCellCustom } from '../../../list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';

@Component({
  selector: 'app-table-cell-org-space-role',
  templateUrl: './table-cell-org-space-role.component.html',
  styleUrls: ['./table-cell-org-space-role.component.scss']
})
export class TableCellRoleOrgSpaceComponent extends TableCellCustom<APIResource<ISpace>> { }
