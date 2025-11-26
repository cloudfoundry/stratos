import { CommonModule, AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';
import { MultiActionListEntity } from '@stratosui/store';

import type { IListDataSource } from '../data-sources-controllers/list-data-source-types';
import { CardCell } from '../list.types';
import { CardComponent } from './card/card.component';
import type { CardTypes } from './card/card.component';

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CardComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardsComponent<T> {
  public columns = CardCell.columns;
  @Input() dataSource!: IListDataSource<T>;
  private pComponent!: CardTypes<T>;
  @Input()
  get component() { return this.pComponent; }
  set component(cardCell: CardTypes<T>) {
    this.pComponent = cardCell;
    /* tslint:disable-next-line */
    this.columns = (cardCell as unknown as { columns: number }).columns;
  }

  public trackByFn(index: number, item: T | MultiActionListEntity): string | number {
    if (!this.dataSource) {
      return index;
    }
    if (this.isMultiActionItem(item)) {
      return this.dataSource.trackBy(index, item.entity as T);
    }
    return this.dataSource.trackBy(index, item as T);
  }

  public multiActionTrackBy() {
    return (index: number, item: T | MultiActionListEntity): string | number | null => {
      if (!this.dataSource) {
        return null;
      }
      if (this.isMultiActionItem(item)) {
        return this.dataSource.trackBy(index, item.entity as T);
      }
      return this.dataSource.trackBy(index, item as T);
    };
  }

  public isMultiActionItem(component: T | MultiActionListEntity) {
    return component instanceof MultiActionListEntity;
  }
}
