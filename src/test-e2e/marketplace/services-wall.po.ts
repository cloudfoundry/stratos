import { Page } from '../po/page.po';
import { ListComponent } from '../po/list.po';
import { ElementArrayFinder, promise, ElementFinder } from 'protractor';
import { MetaCard } from '../po/meta-card.po';

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

  serviceInstancesList = new ListComponent();
  constructor() {
    super('/services');
  }

  getServiceInstances = (): ElementArrayFinder => {
    return this.serviceInstancesList.cards.getCards();
  }

  getServiceInstanceFromCard = (card: ElementFinder): promise.Promise<ServiceInstance> => {
    const metaCard = new MetaCard(card);
      return metaCard.getMetaCardItems().then(items => ({
        serviceInstanceName: metaCard.getTitle(),
        spaceName: items[0].value,
        serviceName: items[1].value,
        planName: items[2].value,
        applicationsAttached: items[3].value,
      }));
    }
}
