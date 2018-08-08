import { browser, promise } from 'protractor';
import { Page } from '../po/page.po';
import { DeleteApplication } from './delete-app.po';

export class ApplicationSummary extends Page {

  constructor(public cfGuid?: string, public appGuid?: string, public appName?: string) {
    super(`/applications/${cfGuid}/${appGuid}/summary`);
  }

  // Detect cfGuid and appGuid from the URL
  public static detect(): promise.Promise<ApplicationSummary> {
    return browser.getCurrentUrl().then(url => {
      if (url.indexOf(browser.baseUrl) === 0) {
        url = url.substr(browser.baseUrl.length + 1);
      }
      const urlParts = url.split('/');
      expect(urlParts.length).toBe(4);
      expect(urlParts[0]).toBe('applications');
      expect(urlParts[3]).toBe('summary');
      const cfGuid = urlParts[1];
      const appGuid = urlParts[2];
      return new ApplicationSummary(cfGuid, appGuid);
    });
  }

  public getAppName() {
    return this.header.getTitleText();
  }

  public delete(): DeleteApplication {
    const deleteApp = new DeleteApplication(this.cfGuid, this.appGuid, this.appName);
    this.header.clickIconButton('delete');
    deleteApp.waitForPage();
    deleteApp.stepper.waitUntilShown();
    return deleteApp;
  }
}
