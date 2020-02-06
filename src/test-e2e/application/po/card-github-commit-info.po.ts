import { by, element, ElementFinder } from 'protractor';

import { MetaCard, MetaCardTitleType } from '../../po/meta-card.po';
import { MetaDataItemComponent } from '../../po/meta-data-item.po';


export class CardGithubCommitInfo extends MetaCard {

  message: MetaDataItemComponent;
  sha: MetaDataItemComponent;
  author: MetaDataItemComponent;

  constructor(locator: ElementFinder = element(by.css('app-tile-grid app-tile-group app-tile:nth-of-type(3)'))) {
    super(locator, MetaCardTitleType.MAT_CARD);
    this.message = MetaDataItemComponent.withLabel(this.locator, 'Message');
    this.sha = MetaDataItemComponent.withLabel(this.locator, 'SHA');
    this.author = MetaDataItemComponent.withLabel(this.locator, 'Author');
  }

}
