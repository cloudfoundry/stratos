import { Type } from '@angular/core';

import { CardCell } from '../list.types';


export interface ICardMultiActionComponentList {
  [schemaKey: string]: Type<CardCell<any>>;
}

export class CardMultiActionComponents {
  constructor(private cardList: ICardMultiActionComponentList, public columns = CardCell.columns) { }
  public getComponent(schemaKey: string) {
    return this.cardList[schemaKey];
  }
}

export type CardDynamicComponentFn<T> = (row: T) => Type<CardCell<T>>;

export class CardDynamicComponent<T> {
  constructor(public getComponent: CardDynamicComponentFn<T>) { }
}
