import { by, element, ElementFinder } from 'protractor';

import { MetaCard, MetaCardTitleType } from '../../po/meta-card.po';
import { MetaDataItemComponent } from '../../po/meta-data-item.po';


export class CardAppCfInfo extends MetaCard {

  cf: MetaDataItemComponent;
  org: MetaDataItemComponent;
  space: MetaDataItemComponent;

  constructor(locator: ElementFinder = element(by.css('app-build-tab app-tile-grid app-tile-group:nth-of-type(2)'))) {
    super(locator, MetaCardTitleType.MAT_CARD);

    this.cf = MetaDataItemComponent.withLabel(locator, 'Name');
    this.org = MetaDataItemComponent.withLabel(locator, 'Organization');
    this.space = MetaDataItemComponent.withLabel(locator, 'Space');
  }



}
