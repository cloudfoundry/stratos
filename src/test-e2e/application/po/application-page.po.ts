import { browser, promise } from 'protractor';

import { CFPage } from '../../po/cf-page.po';
import { DeleteApplication } from './delete-app.po';

export class ApplicationBasePage extends CFPage {

  constructor(public cfGuid: string, public appGuid: string, public initialTab = 'summary') {
    super(`/applications/${cfGuid}/${appGuid}/${initialTab}`);
  }

  // Detect cfGuid and appGuid from the URL
  public static detect(): promise.Promise<ApplicationBasePage> {
    return browser.getCurrentUrl().then(url => {
      if (url.indexOf(browser.baseUrl) === 0) {
        url = url.substr(browser.baseUrl.length + 1);
      }
      const urlParts = url.split('/');
      expect(urlParts.length).toBe(4);
      expect(urlParts[0]).toBe('applications');
      const cfGuid = urlParts[1];
      const appGuid = urlParts[2];
      return new ApplicationBasePage(cfGuid, appGuid);
    });
  }

  public goToSummaryTab() {
    return this.goToTab('Summary', 'summary');
  }

  public goToInstancesTab() {
    return this.goToTab('Instances', 'instances');
  }

  public goToRoutesTab() {
    return this.goToTab('Routes', 'routes');
  }

  public goToLogStreamTab() {
    // log viewer blocks angular from settling
    browser.waitForAngularEnabled(false);
    return this.goToTab('Log Stream', 'log-stream').then(() => {
      browser.waitForAngularEnabled(true);
    });
  }

  public goToServicesTab() {
    return this.goToTab('Services', 'services');
  }

  public goToVariablesTab() {
    return this.goToTab('Variables', 'variables');
  }

  public goToEventsTab() {
    return this.goToTab('Events', 'events');
  }

  public goToGithubTab() {
    return this.goToTab('GitHub', 'gitscm');
  }

  public goToAutoscalerTab() {
    return this.goToTab('Autoscale', 'autoscale');
  }

  public waitForAutoscalerTab() {
    return this.tabs.waitForItem('Autoscale', 15000);
  }

  private goToTab(label: string, urlSuffix: string) {
    return this.tabs.goToItemAndWait(label, this.navLink.substring(0, this.navLink.lastIndexOf('/')), urlSuffix);
  }

  public getAppName() {
    return this.header.getTitleText();
  }

  public delete(): DeleteApplication {
    const deleteApp = new DeleteApplication(this.cfGuid, this.appGuid);
    this.subHeader.clickIconButton('delete');
    deleteApp.waitForPage();
    deleteApp.stepper.waitUntilShown();
    return deleteApp;
  }
}
