import { Component } from '@angular/core';

import { TableCellCustomComponent } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { ISpace } from '../../../../../../cf-api.types';

@Component({
  selector: 'app-table-cell-org-space-role',
  templateUrl: './table-cell-org-space-role.component.html',
  styleUrls: ['./table-cell-org-space-role.component.scss']
})
export class TableCellRoleOrgSpaceComponent extends TableCellCustomComponent<APIResource<ISpace>> { }
