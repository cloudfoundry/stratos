import { protractor, ElementArrayFinder, ElementFinder } from 'protractor';
import { browser, promise } from 'protractor';
import { Page } from '../po/page.po';
import { ListComponent } from '../po/list.po';

export class CreateServiceInstance extends Page {

  constructor() {
    super('/services/new');
   }

}
