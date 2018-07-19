import { protractor, ElementArrayFinder, ElementFinder } from 'protractor';
import { browser, promise } from 'protractor';
import { Page } from '../po/page.po';
import { ListComponent } from '../po/list.po';

export class MarketplacePage extends Page {

  servicesList = new ListComponent();

  constructor() {
    super('/marketplace');
   }

  getServices = (): ElementArrayFinder => {
    return this.servicesList.cards.getCards();
  }

}
