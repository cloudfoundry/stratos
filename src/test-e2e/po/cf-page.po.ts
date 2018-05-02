import { protractor, ElementFinder } from 'protractor/built';
import { browser, element, by } from 'protractor';
import { Page } from './page.po';
import { NoContentComponent } from './no-content.po';

/**
 * Base CF Page Objeect can be inherited by appropriate pages
 */
export abstract class CFPage extends Page {

  noContent = new NoContentComponent();

  constructor(navLink?: string) {
    super(navLink);
  }

  hasNoCloudFoundryMesasge() {
    return this.noContent.isPresent().then(() => {
      return this.noContent.checkFirstLineMessage('There are no connected Cloud Foundry endpoints');
    });
  }
}

