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
  get row(): T {
    return super.row;
  }
  set row(row: T) {
    super.row = row;
  }

  @Input()
  set dataSource(dataSource: IListDataSource<T>) {
    super.dataSource = dataSource;
  }
  get dataSource(): IListDataSource<T> {
    return super.dataSource;
  }

  @Input()
  subtle: boolean;

  isEditing(): boolean {
    return this.dataSource.editRow ?
      this.dataSource.getRowUniqueId(this.row) === this.dataSource.getRowUniqueId(this.dataSource.editRow) :
      false;
  }
}
