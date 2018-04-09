/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../list.types';

@Component({
  selector: 'app-table-cell-edit',
  templateUrl: './table-cell-edit.component.html',
  styleUrls: ['./table-cell-edit.component.scss']
})
export class TableCellEditComponent<T> extends TableCellCustom<T> { }
