import { IListDataSource } from '../../../data-sources/list-data-source-types';

export abstract class TableCellCustom<T> {
  dataSource: IListDataSource<T>;
  row: T;
  config: any;
}
