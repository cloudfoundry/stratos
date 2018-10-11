import { CFPage } from '../../po/cf-page.po';
import { CfOrgLevelPage } from '../org-level/cf-org-level-page.po';
import { promise, browser } from 'protractor';


export class CfSpaceLevelPage extends CFPage {

  static forEndpoint(guid: string, orgGuid: string, spaceGuid: string): CfSpaceLevelPage {
    return new CfSpaceLevelPage(`/cloud-foundry/${guid}/organizations/${orgGuid}/spaces/${spaceGuid}`);
  }

  // Detect from the URL
  public static detect(): promise.Promise<CfSpaceLevelPage> {
    return browser.getCurrentUrl().then(url => {
      if (url.indexOf(browser.baseUrl) === 0) {
        url = url.substr(browser.baseUrl.length + 1);
      }
      const urlParts = url.split('/');
      expect(urlParts.length).toBe(7);
      expect(urlParts[0]).toBe('cloud-foundry');
      expect(urlParts[2]).toBe('organizations');
      expect(urlParts[4]).toBe('spaces');
      const cfGuid = urlParts[1];
      const orgGuid = urlParts[3];
      const spaceGuid = urlParts[5];
      return CfSpaceLevelPage.forEndpoint(cfGuid, orgGuid, spaceGuid);
    });
  }

  goToSummaryTab() {
    return this.goToTab('Summary', 'summary');
  }

  goToAppsTab() {
    return this.goToTab('Applications', 'apps');
  }

  goToSITab() {
    return this.goToTab('Service Instances', 'service-instances');
  }

  goToRoutesTab() {
    return this.goToTab('Routes', 'routes');
  }

  goToUsersTab() {
    return this.goToTab('Users', 'users');
  }

  private goToTab(label: string, urlSuffix: string) {
    return this.subHeader.goToItemAndWait(label, this.navLink, urlSuffix);
  }

}
