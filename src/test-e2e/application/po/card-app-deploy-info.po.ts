import { by, element, ElementFinder } from 'protractor';

import { MetaCard, MetaCardTitleType } from '../../po/meta-card.po';
import { MetaDataItemComponent } from '../../po/meta-data-item.po';


export class CardAppDeployInfo extends MetaCard {

  gitCommit: MetaDataItemComponent;
  docker: MetaDataItemComponent;

  constructor(
    locator: ElementFinder = element(by.id('app-build-tab-deployment-info'))
  ) {
    super(locator, MetaCardTitleType.MAT_CARD);
    this.gitCommit = MetaDataItemComponent.withDynamicLabel(locator, 'Commit');
    this.docker = MetaDataItemComponent.withDynamicLabel(locator, 'Docker Image');
  }

}
