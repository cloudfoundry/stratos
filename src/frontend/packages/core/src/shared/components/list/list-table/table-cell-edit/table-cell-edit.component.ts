import { Component, Input } from '@angular/core';

import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { TableCellCustom } from '../../list.types';

@Component({
  selector: 'app-table-cell-edit',
  templateUrl: './table-cell-edit.component.html',
  styleUrls: ['./table-cell-edit.component.scss']
})
export class TableCellEditComponent<T> extends TableCellCustom<T> {

  @Input()
  row: T;

  @Input()
  dataSource: IListDataSource<T>;

  @Input()
  subtle: boolean;

  isEditing(): boolean {
    return this.dataSource.editRow ?
      this.dataSource.getRowUniqueId(this.row) === this.dataSource.getRowUniqueId(this.dataSource.editRow) :
      false
  }
}
