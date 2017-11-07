import { IListDataSource } from '../../../data-sources/list-data-source';

export abstract class TableCellCustom<T> {
  dataSource: IListDataSource<T>;
  row: T;
}
