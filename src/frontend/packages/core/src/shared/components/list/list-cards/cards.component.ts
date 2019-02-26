import { Component, Input } from '@angular/core';

import { IListDataSource } from '../data-sources-controllers/list-data-source-types';
import { CardCell } from '../list.types';

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss']
})
export class CardsComponent<T> {
  public columns = CardCell.columns;
  @Input() dataSource: IListDataSource<T>;
  private pComponent: CardCell<T>;
  @Input()
  get component() { return this.pComponent; }
  set component(cardCell) {
    this.pComponent = cardCell;
    /* tslint:disable-next-line:no-string-literal  */
    this.columns = cardCell['columns'];
  }
}
