import { Type } from '@angular/core';

import { CardCell } from '../../list.types';

export interface ICardMultiActionComponentList {
  [schemaKey: string]: Type<CardCell<any>>;
}

export class CardMultiActionComponents {
  public __cardMultiActionComponents__ = true;
  constructor(private cardList: ICardMultiActionComponentList, public columns = CardCell.columns) { }
  public getComponent(schemaKey: string) {
    return this.cardList[schemaKey];
  }
}
