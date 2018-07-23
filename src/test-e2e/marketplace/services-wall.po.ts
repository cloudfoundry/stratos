import { Page } from '../po/page.po';
import { ListComponent } from '../po/list.po';
import { ElementArrayFinder } from 'protractor';

export class ServicesWallPage extends Page {

  serviceInstancesList = new ListComponent();
  constructor() {
    super('/services');
  }

  getServiceInstances = (): ElementArrayFinder => {
    return this.serviceInstancesList.cards.getCards();
  }
}
