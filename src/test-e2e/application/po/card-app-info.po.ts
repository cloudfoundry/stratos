import { by, element, ElementFinder } from 'protractor';

import { MetaCard, MetaCardTitleType } from '../../po/meta-card.po';
import { MetaDataItemComponent } from '../../po/meta-data-item.po';


export class CardAppInfo extends MetaCard {

  memQuota: MetaDataItemComponent;
  diskQuota: MetaDataItemComponent;
  appState: MetaDataItemComponent;
  packageState: MetaDataItemComponent;
  services: MetaDataItemComponent;
  routes: MetaDataItemComponent;

  constructor(locator: ElementFinder = element(by.css('app-build-tab app-tile-grid app-tile-group:nth-of-type(2)'))) {
    super(locator, MetaCardTitleType.MAT_CARD);

    this.memQuota = MetaDataItemComponent.withLabel(locator, 'Memory Quota');
    this.diskQuota = MetaDataItemComponent.withLabel(locator, 'Disk Quota');
    this.appState = MetaDataItemComponent.withLabel(locator, 'App State');
    this.packageState = MetaDataItemComponent.withLabel(locator, 'Package State');
    this.services = MetaDataItemComponent.withLabel(locator, 'Services');
    this.routes = MetaDataItemComponent.withLabel(locator, 'Routes');
  }

}
