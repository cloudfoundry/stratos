import { by, element, ElementFinder } from 'protractor';

import { MetaCard, MetaCardTitleType } from '../../po/meta-card.po';
import { MetaDataItemComponent } from '../../po/meta-data-item.po';


export class CardGithubDeployInfo extends MetaCard {

  repo: MetaDataItemComponent;
  branch: MetaDataItemComponent;
  commit: MetaDataItemComponent;
  deployed: MetaDataItemComponent;

  constructor(locator: ElementFinder = element(by.css('app-tile-grid app-tile-group app-tile:nth-of-type(1)'))) {
    super(locator, MetaCardTitleType.MAT_CARD);
    this.repo = MetaDataItemComponent.withLabel(this.locator, 'Repository');
    this.branch = MetaDataItemComponent.withLabel(this.locator, 'Branch');
    this.commit = MetaDataItemComponent.withLabel(this.locator, 'Commit');
    this.deployed = MetaDataItemComponent.withLabel(this.locator, 'Deployed');
  }


}
