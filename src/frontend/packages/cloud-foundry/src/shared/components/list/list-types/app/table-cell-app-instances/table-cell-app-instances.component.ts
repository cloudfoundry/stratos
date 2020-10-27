import { Component } from '@angular/core';

import { TableCellCustomComponent } from '../../../../../../../../core/src/shared/components/list/list.types';

@Component({
  selector: 'app-table-cell-app-instances',
  templateUrl: './table-cell-app-instances.component.html',
  styleUrls: ['./table-cell-app-instances.component.scss']
})
export class TableCellAppInstancesComponent<T> extends TableCellCustomComponent<T> { }
