import { by, element, ElementArrayFinder, ElementFinder, promise } from 'protractor';

import { ListComponent } from '../po/list.po';
import { MetaCard, MetaCardTitleType } from '../po/meta-card.po';
import { Page } from '../po/page.po';

export interface ServiceInstance {
  serviceInstanceName: promise.Promise<string>;
  spaceName: promise.Promise<string>;
  serviceName: promise.Promise<string>;
  planName: promise.Promise<string>;
  tags?: promise.Promise<string>;
  applicationsAttached?: promise.Promise<string>;
  creationDate?: promise.Promise<string>;
}

export class ServicesWallPage extends Page {

  static FilterIds = {
    cf: 'cf'
  };

  serviceInstancesList = new ListComponent();
  constructor() {
    super('/services');
  }

  clickCreateServiceInstance(): any {
    return this.helpers.waitForElementAndClick(element(by.buttonText('add')));
  }

  getServiceInstances = (): ElementArrayFinder => {
    return this.serviceInstancesList.cards.getCards();
  }

  getServiceInstanceFromCard = (card: ElementFinder): promise.Promise<ServiceInstance> => {
    const metaCard = new MetaCard(card, MetaCardTitleType.CUSTOM);
    return metaCard.getMetaCardItems().then((items): ServiceInstance => ({
      serviceInstanceName: metaCard.getTitle(),
      spaceName: items[0].value,
      serviceName: items[1].value,
      planName: items[2].value,
      applicationsAttached: items[3].value,
    }));
  }

  isActivePage() {
    return super.isActivePage(true);
  }

  waitForPage() {
    return super.waitForPage(undefined, true);
  }
}
