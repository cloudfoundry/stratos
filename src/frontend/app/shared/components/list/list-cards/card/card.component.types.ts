import { Type } from '@angular/core';

import { CardCell } from '../../list.types';

export interface ICardMultiActionComponentList {
  [schemaKey: string]: Type<CardCell<any>>;
}

export class CardMultiActionComponents {
  public __cardMultiActionComponents__ = true;
  static getComponentFromMultiAction(component: any | CardMultiActionComponents, schemaKey?: string) {
    if (component instanceof CardMultiActionComponents) {
      return component.getComponent(schemaKey);
    }
    return component;
  }
  constructor(private cardList: ICardMultiActionComponentList, public columns = CardCell.columns) { }
  public getComponent(schemaKey: string) {
    return this.cardList[schemaKey];
  }
}
