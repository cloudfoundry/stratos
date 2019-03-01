import { Type } from '@angular/core';

import { CardCell } from '../../list.types';

export interface ICardMultiActionComponentList {
  [schemaKey: string]: Type<CardCell<any>>;
}

export class CardMultiActionComponents {
  constructor(private cardList: ICardMultiActionComponentList, public columns?: number) { }
  public getComponent(schemaKey: string) {
    return this.cardList[schemaKey];
  }
}
