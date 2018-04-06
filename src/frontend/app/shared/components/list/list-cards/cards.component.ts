import { Component, Input } from '@angular/core';

import { IListDataSource } from '../data-sources-controllers/list-data-source-types';
import { TableCellCustom } from '../list.types';

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss']
})
export class CardsComponent<T> {
  @Input('dataSource') dataSource: IListDataSource<T>;
  @Input('component') component: TableCellCustom<T>;
}
