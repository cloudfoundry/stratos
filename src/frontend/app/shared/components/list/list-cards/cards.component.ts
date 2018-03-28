import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';

import { IListDataSource } from '../data-sources-controllers/list-data-source-types';
import { CardSize, TableCellCustom } from '../list-table/table-cell/table-cell-custom';


@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss']
})
export class CardsComponent<T> implements OnInit {

  @Input('dataSource') dataSource: IListDataSource<T>;
  @Input('component') component: TableCellCustom<T>;

  private size: CardSize;

  private cardSize = CardSize;

  ngOnInit() {
    this.size = this.component ? this.component.size : null;
  }
}
