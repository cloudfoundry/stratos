import { by, element, ElementFinder } from 'protractor';

import { MetaCard, MetaCardTitleType } from '../../po/meta-card.po';
import { MetaDataItemComponent } from '../../po/meta-data-item.po';


export class CardAppBuildInfo extends MetaCard {

  buildPack: MetaDataItemComponent;
  stack: MetaDataItemComponent;

  constructor(locator: ElementFinder = element(by.css('app-build-tab app-tile-grid app-tile-group:nth-of-type(3)'))) {
    super(locator, MetaCardTitleType.MAT_CARD);

    this.buildPack = MetaDataItemComponent.withLabel(locator, 'Buildpack');
    this.stack = MetaDataItemComponent.withLabel(locator, 'Stack');
  }

}
