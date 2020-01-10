import { browser, by, element, promise, protractor } from 'protractor';

import { CFPage } from '../../po/cf-page.po';
import { Component } from '../../po/component.po';
import { ConfirmDialogComponent } from '../../po/confirm-dialog';
import { ListComponent } from '../../po/list.po';
import { MetaCardTitleType } from '../../po/meta-card.po';
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

  // Detect cfGuid from the URL
  public static detect(): promise.Promise<CfTopLevelPage> {
    return browser.getCurrentUrl().then(url => {
      if (url.indexOf(browser.baseUrl) === 0) {
        url = url.substr(browser.baseUrl.length + 1);
      }
      const urlParts = url.split('/');
      expect(urlParts.length).toBe(3);
      expect(urlParts[0]).toBe('cloud-foundry');
      const cfGuid = urlParts[1];
      return CfTopLevelPage.forEndpoint(cfGuid);
    });
  }

  // Goto the Organizations view (tab)
  goToOrgView(): ListComponent {
    this.tabs.clickItem('Organizations');
    const cardView = new ListComponent();
    cardView.cards.waitUntilShown();
    return cardView;
  }

  deleteOrg(orgName) {
    const cardView = this.goToOrgView();

    cardView.cards.findCardByTitle(orgName, MetaCardTitleType.CUSTOM, true).then(card => {
      card.openActionMenu().then(menu => {
        menu.clickItem('Delete');
        ConfirmDialogComponent.expectDialogAndConfirm('Delete', 'Delete Organization', orgName);
        card.waitUntilNotShown();
      });
    });
  }

  clickOnQuota(quotaName: string) {
    const { table, header } = new ListComponent();
    table.waitUntilShown();
    header.setSearchText(quotaName);

    const row = table.findRowByCellContent(quotaName);
    row.element(by.css('a')).click();
  }

  deleteQuota(quotaName: string, waitUntilNotShown = true) {
    const { table, header } = new ListComponent();
    table.waitUntilShown();
    header.setSearchText(quotaName);

    const row = table.findRowByCellContent(quotaName);
    const menu = table.openRowActionMenuByRow(row);
    menu.clickItem('Delete');
    ConfirmDialogComponent.expectDialogAndConfirm('Delete', 'Delete Quota', quotaName);

    if (waitUntilNotShown) {
      browser.wait(this.until.invisibilityOf(row), 20000);
    }
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

  waitForInstanceAddressValue(): promise.Promise<string> {
    return this.waitForInstanceAddress().getValue().then(val => val.replace('content_copy', '').trim());
  }

  waitForApiVersion(): MetaDataItemComponent {
    return this.waitForMetaDataItemComponent('CF API Version');
  }

  waitForUsername(): MetaDataItemComponent {
    return this.waitForMetaDataItemComponent('Account Username');
  }

  private waitForMetaDataItemComponent(label: string): MetaDataItemComponent {
    const comp = MetaDataItemComponent.withLabel(element(by.css('app-cloud-foundry-summary-tab')), label);
    comp.waitUntilShown();
    return comp;
  }

  isUserInviteConfigured(isAdmin: boolean = true): promise.Promise<boolean> {
    return this.waitForMetaDataItemComponent('User Invitation Support').getValue().then(value =>
      isAdmin ? value.startsWith('Configured') : value.startsWith('Enabled')
    );
  }

  getInviteConfigureButton(): Component {
    return new Component(element(by.cssContainingText('.user-invites button', 'Configure')));
  }

  getInviteDisableButton(): Component {
    return new Component(element(by.cssContainingText('.user-invites button', 'Disable')));
  }

  canConfigureUserInvite(): promise.Promise<boolean> {
    return this.waitForMetaDataItemComponent('User Invitation Support').getValue().then(value => value.endsWith('Configure'));
  }

  clickInviteConfigure(): promise.Promise<any> {
    return this.getInviteConfigureButton().getComponent().click();
  }

  clickInviteDisable(): promise.Promise<any> {
    return this.getInviteDisableButton().getComponent().click();
  }

  goToSummaryTab() {
    return this.goToTab('Summary', 'summary');
  }

  goToOrgTab() {
    return this.goToTab('Organizations', 'organizations');
  }

  goToQuotasTab() {
    return this.goToTab('Organization Quotas', 'quota-definitions');
  }

  goToRoutesTab() {
    return this.goToTab('Routes', 'routes');
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

  clickOnCard(orgName: string) {
    const list = new ListComponent();
    list.cards.findCardByTitle(orgName).then((card) => {
      expect(card).toBeDefined();
      card.click();
    });
  }

  private goToTab(label: string, urlSuffix: string): promise.Promise<any> {
    // Some tabs don't appear until the page has fully loaded - so wait until the tab is present
    const tabElement = this.tabs.getItem(label);
    browser.wait(this.until.presenceOf(tabElement), 10000, 'Tab: ' + label);
    return this.tabs.goToItemAndWait(label, this.navLink, urlSuffix);
  }

}
