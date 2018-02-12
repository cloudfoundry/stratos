import { IListDataSource, RowState } from '../../data-sources-controllers/list-data-source-types';
import { Observable } from 'rxjs/Observable';

export enum CardSize {
  LARGE = 'large'
}
export abstract class TableCellCustom<T> {
  dataSource: IListDataSource<T>;
  row: T;
  config: any;
  rowState: Observable<RowState>;
  size?: CardSize;
}
