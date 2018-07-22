import { Page } from '../po/page.po';
import { DeleteApplication } from './delete-app.po';

export class ApplicationSummary extends Page {

  constructor(public cfGuid: string, public appGuid?: string, public appName?: string) {
    super(`/applications/${cfGuid}/${appGuid}/summary`);
  }

  public delete(): DeleteApplication {
    const deleteApp = new DeleteApplication(this.cfGuid, this.appGuid, this.appName);
    this.header.clickIconButton('delete');
    deleteApp.waitForPage();
    deleteApp.stepper.waitUntilShown();
    return deleteApp;
  }
}
