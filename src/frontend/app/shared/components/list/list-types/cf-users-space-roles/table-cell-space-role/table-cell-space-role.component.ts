import { Component } from '@angular/core';

import { ISpace } from '../../../../../../core/cf-api.types';
import { APIResource } from '../../../../../../store/types/api.types';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-space-role',
  templateUrl: './table-cell-space-role.component.html',
  styleUrls: ['./table-cell-space-role.component.scss']
})
export class TableCellSpaceRoleComponent extends TableCellCustom<APIResource<ISpace>> { }
