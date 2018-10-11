import { by, element, ElementFinder, promise } from 'protractor';

import { MetaCard, MetaCardTitleType } from '../../po/meta-card.po';


export class CardAppUptime extends MetaCard {

  constructor(locator: ElementFinder = element(by.css('.card-app-uptime'))) {
    super(locator, MetaCardTitleType.MAT_CARD);
  }

  getUptime(): ElementFinder {
    return this.locator.element(by.css('mat-card-content'));
  }

  getUptimeText(): promise.Promise<string> {
    return this.getUptime().getText();
  }

}
