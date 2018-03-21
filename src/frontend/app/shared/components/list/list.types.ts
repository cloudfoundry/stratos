import { IListDataSource, RowState } from './data-sources-controllers/list-data-source-types';
import { Observable } from 'rxjs/Observable';

export abstract class TableCellCustom<T> {
  dataSource: IListDataSource<T>;
  row: T;
  config: any;
  rowState: Observable<RowState>;
}

export abstract class CardCell<T> extends TableCellCustom<T> {
  static columns = 3;
}
