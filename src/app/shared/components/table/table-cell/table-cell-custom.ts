import { ITableDataSource } from '../../../data-sources/table-data-source';

export abstract class TableCellCustom<T> {
  dataSource: ITableDataSource<T>;
  row: T;
}
