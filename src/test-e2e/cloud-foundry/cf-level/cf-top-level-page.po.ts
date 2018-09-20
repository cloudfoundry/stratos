import { browser, by, element, promise, protractor } from 'protractor';

import { CFPage } from '../../po/cf-page.po';
import { ListComponent } from '../../po/list.po';
import { MetaDataItemComponent } from '../../po/meta-data-item.po';


export class CfTopLevelPage extends CFPage {

  private readonly until = protractor.ExpectedConditions;

  constructor() {
    super('/cloud-foundry');
  }

  static forEndpoint(guid: string): CfTopLevelPage {
    const page = new CfTopLevelPage();
    page.navLink = '/cloud-foundry/' + guid;
    return page;
  }

  // Goto the Organizations view (tab)
  goToOrgView(): ListComponent {
    this.subHeader.clickItem('Organizations');
    const cardView = new ListComponent();
    cardView.cards.waitUntilShown();
    return cardView;
  }

  isSummaryView(): promise.Promise<boolean> {
    return browser.getCurrentUrl().then(url => {
      return url.startsWith(browser.baseUrl + this.navLink) && url.endsWith('/summary');
    });
  }

  waitForSummaryDescription(): MetaDataItemComponent {
    return this.waitForMetaDataItemComponent('Description');
  }

  waitForInstanceAddress(): MetaDataItemComponent {
    return this.waitForMetaDataItemComponent('Instance Address');
  }

  waitForApiVersion(): MetaDataItemComponent {
    return this.waitForMetaDataItemComponent('CF API Version');
  }

  waitForUsername(): MetaDataItemComponent {
    return this.waitForMetaDataItemComponent('Account Username');
  }

  waitForAdministrator(): MetaDataItemComponent {
    return this.waitForMetaDataItemComponent('Administrator');
  }

  private waitForMetaDataItemComponent(label: string): MetaDataItemComponent {
    const comp = MetaDataItemComponent.withLabel(element(by.css('app-cloud-foundry-summary-tab')), label);
    comp.waitUntilShown();
    return comp;
  }

  goToSummaryTab() {
    return this.goToTab('Summary', 'summary');
  }

  goToOrgTab() {
    return this.goToTab('Organizations', 'organizations');
  }

  goToUsersTab() {
    return this.goToTab('Users', 'users');
  }

  goToFirehoseTab() {
    // log viewer blocks angular from settling
    browser.waitForAngularEnabled(false);
    return this.goToTab('Firehose', 'firehose').then(() => {
      browser.waitForAngularEnabled(true);
    });
  }

  goToFeatureFlagsTab() {
    return this.goToTab('Feature Flags', 'feature-flags');
  }

  goToBuildPacksTab() {
    return this.goToTab('Build Packs', 'build-packs');
  }

  goToStacksTab() {
    return this.goToTab('Stacks', 'stacks');
  }

  goToSecurityGroupsTab() {
    return this.goToTab('Security Groups', 'security-groups');
  }

  private goToTab(label: string, urlSuffix: string): promise.Promise<any> {
    // Some tabs don't appear until the page has fully loaded - so wait until the tab is present
    const tabElement = this.subHeader.getItem(label);
    browser.wait(this.until.presenceOf(tabElement), 10000);
    return this.subHeader.goToItemAndWait(label, this.navLink, urlSuffix);
  }

}
