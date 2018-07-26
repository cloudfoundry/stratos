import { browser, by, element, promise } from 'protractor';

import { ListComponent } from '../../po/list.po';
import { MetaDataItemComponent } from '../../po/meta-data-time.po';
import { CFPage } from '../../po/cf-page.po';


export class CfTopLevelPage extends CFPage {

  // static forEndpoint(guid: string, orgGuid?: string, spaceGuid?: string): CloudFoundryLevelPage {
  //   const page = new CloudFoundryPage();
  //   page.navLink = '/cloud-foundry/' + guid;
  //   if (orgGuid) {
  //     page.navLink += '/organizations/' + orgGuid;
  //     if (spaceGuid) {
  //       page.navLink += '/spaces/' + spaceGuid;
  //     }
  //   }
  //   return page;
  // }
  static forEndpoint(guid: string, orgGuid?: string, spaceGuid?: string): CfTopLevelPage {
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

  getSummaryDescription(): MetaDataItemComponent {
    return new MetaDataItemComponent(element(by.css('app-metadata-item[@label="Description"]')));
  }

  getInstanceAddress(): MetaDataItemComponent {
    return new MetaDataItemComponent(element(by.css('app-metadata-item[label="Instance Address"]')));
  }

  getApiVersion(): MetaDataItemComponent {
    return new MetaDataItemComponent(element(by.css('app-metadata-item[label="CF API Version"]')));
  }

  getUsername(): MetaDataItemComponent {
    return new MetaDataItemComponent(element(by.css('app-metadata-item[label="Account Username"]')));
  }

  getAdministrator(): MetaDataItemComponent {
    return new MetaDataItemComponent(element(by.css('app-metadata-item[label="Administrator"]')));
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
    return this.goToTab('Firehose', 'firehose');
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

  private goToTab(label: string, urlSuffix: string) {
    return this.subHeader.goToItemAndWait(label, this.navLink, urlSuffix);
  }

}
