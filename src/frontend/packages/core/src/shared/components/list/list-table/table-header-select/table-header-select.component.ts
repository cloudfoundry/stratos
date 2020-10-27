import { Component } from '@angular/core';

import { TableCellCustomComponent } from '../../list.types';

@Component({
  selector: 'app-table-header-select',
  templateUrl: './table-header-select.component.html',
  styleUrls: ['./table-header-select.component.scss']
})
export class TableHeaderSelectComponent<T> extends TableCellCustomComponent<T> { }
