import { ElementArrayFinder } from 'protractor';

import { ListComponent } from '../po/list.po';
import { Page } from '../po/page.po';

export class MarketplacePage extends Page {

  static FilterIds = {
    cf: 'cf'
  };

  servicesList = new ListComponent();

  constructor() {
    super('/marketplace');
  }

  getServices = (): ElementArrayFinder => {
    return this.servicesList.cards.getCards();
  }

}
