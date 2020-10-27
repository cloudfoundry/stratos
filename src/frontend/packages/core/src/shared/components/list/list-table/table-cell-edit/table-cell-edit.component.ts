import { Component, Input } from '@angular/core';

import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { TableCellCustomComponent } from '../../list.types';

@Component({
  selector: 'app-table-cell-edit',
  templateUrl: './table-cell-edit.component.html',
  styleUrls: ['./table-cell-edit.component.scss']
})
export class TableCellEditComponent<T> extends TableCellCustomComponent<T> {

  @Input()
  get row(): T {
    return this.pRow;
  }
  set row(row: T) {
    this.pRow = row;
  }

  @Input()
  set dataSource(dataSource: IListDataSource<T>) {
    this.pDataSource = dataSource;
  }
  get dataSource(): IListDataSource<T> {
    return this.pDataSource;
  }


  @Input()
  subtle: boolean;

  isEditing(): boolean {
    return this.dataSource.editRow ?
      this.dataSource.getRowUniqueId(this.row) === this.dataSource.getRowUniqueId(this.dataSource.editRow) :
      false;
  }
}
