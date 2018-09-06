import { by, element, ElementFinder } from 'protractor';

import { MetaCard, MetaCardTitleType } from '../../po/meta-card.po';
import { MetaDataItemComponent } from '../../po/meta-data-item.po';


export class CardAppDeployInfo extends MetaCard {

  github: MetaDataItemComponent;

  constructor(
    locator: ElementFinder = element(by.css('app-build-tab app-tile-grid app-tile-group:nth-of-type(3) app-tile:nth-of-type(2)'))
  ) {
    super(locator, MetaCardTitleType.MAT_CARD);
    this.github = MetaDataItemComponent.withLabel(locator, 'GitHub');

  }

}
