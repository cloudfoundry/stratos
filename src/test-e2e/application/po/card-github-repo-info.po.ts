import { by, element, ElementFinder } from 'protractor';

import { MetaCard, MetaCardTitleType } from '../../po/meta-card.po';
import { MetaDataItemComponent } from '../../po/meta-data-item.po';


export class CardGithubRepoInfo extends MetaCard {

  name: MetaDataItemComponent;
  owner: MetaDataItemComponent;
  description: MetaDataItemComponent;

  constructor(locator: ElementFinder = element(by.css('app-tile-grid app-tile-group app-tile:nth-of-type(2)'))) {
    super(locator, MetaCardTitleType.MAT_CARD);
    this.name = MetaDataItemComponent.withLabel(this.locator, 'Full Name');
    this.owner = MetaDataItemComponent.withLabel(this.locator, 'Owner');
    this.description = MetaDataItemComponent.withLabel(this.locator, 'Description');
  }

}
