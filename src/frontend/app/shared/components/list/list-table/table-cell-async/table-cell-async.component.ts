import { Component } from '@angular/core';

import { pathGet } from '../../../../../core/utils.service';
import { TableCellCustom } from '../../list.types';


export interface TableCellAsyncConfig {
  pathToObs: string;
  pathToValue: string;
}

@Component({
  selector: 'app-table-cell-async',
  templateUrl: './table-cell-async.component.html',
  styleUrls: ['./table-cell-async.component.scss']
})
export class TableCellAsyncComponent<T> extends TableCellCustom<T> {

  constructor() {
    super();
  }

  pathGet = pathGet;
}
