import { protractor, ElementFinder } from 'protractor/built';
import { browser, element, by, ElementArrayFinder } from 'protractor';
import { CFPage } from '../po/cf-page.po';

export class ServicesPage extends CFPage {

  constructor() {
    super('/services');
  }
}
