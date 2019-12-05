import { by, element, ElementFinder } from 'protractor';

import { MetaCard, MetaCardTitleType } from '../../po/meta-card.po';


export class CardAppUsage extends MetaCard {

  constructor(locator: ElementFinder = element(by.css('app-card-app-usage'))) {
    super(locator, MetaCardTitleType.MAT_CARD);
  }

  getUsageTable(): ElementFinder {
    return this.locator.element(by.css('.instances__detail'));
  }

}
