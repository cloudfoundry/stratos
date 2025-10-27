import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { TableCellCustom } from '../../list.types';

@Component({
  selector: 'app-table-header-select',
  templateUrl: './table-header-select.component.html',
  styleUrls: ['./table-header-select.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule
  ]
})
export class TableHeaderSelectComponent<T> extends TableCellCustom<T> { }
