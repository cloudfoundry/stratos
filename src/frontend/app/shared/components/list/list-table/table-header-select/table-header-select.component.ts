/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../list.types';

@Component({
  selector: 'app-table-header-select',
  templateUrl: './table-header-select.component.html',
  styleUrls: ['./table-header-select.component.scss']
})
export class TableHeaderSelectComponent<T> extends TableCellCustom<T> { }
