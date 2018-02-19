import { Observable } from 'rxjs/Observable';

import { IListDataSource, RowState } from '../../data-sources-controllers/list-data-source-types';

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
