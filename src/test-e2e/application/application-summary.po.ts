import { Page } from '../po/page.po';

export class ApplicationSummary extends Page {

  constructor(cfGuid: string, appGuid: string, private appName: string) {
    super(`/applications/${cfGuid}/${appGuid}/summary`);
  }

}
