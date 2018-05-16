import { protractor, ElementFinder } from 'protractor/built';
import { browser, element, by, ElementArrayFinder } from 'protractor';
import { CFPage } from '../po/cf-page.po';

export class ApplicationsPage extends CFPage {

  constructor() {
    super('/applications');
  }
}
