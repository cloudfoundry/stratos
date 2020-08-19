import { Component, Input } from '@angular/core';

import { MultiActionListEntity } from '@stratosui/store';
import { IListDataSource } from '../data-sources-controllers/list-data-source-types';
import { CardCell } from '../list.types';
import { CardTypes } from './card/card.component';

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss']
})
export class CardsComponent<T> {
  public columns = CardCell.columns;
  @Input() dataSource: IListDataSource<T>;
  private pComponent: CardTypes<T>;
  @Input()
  get component() { return this.pComponent; }
  set component(cardCell: CardTypes<T>) {
    this.pComponent = cardCell;
    /* tslint:disable-next-line */
    this.columns = cardCell['columns'];
  }

  public multiActionTrackBy() {
    return (index: number, item: any | MultiActionListEntity) => {
      if (!this.dataSource) {
        return null;
      }
      if (this.isMultiActionItem(item)) {
        return this.dataSource.trackBy(index, item.entity);
      }
      return this.dataSource.trackBy(index, item);
    };
  }

  public isMultiActionItem(component: any | MultiActionListEntity) {
    return component instanceof MultiActionListEntity;
  }
}
