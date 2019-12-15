import { browser, promise } from 'protractor';

import { Page } from '../../po/page.po';
import { ListComponent } from '../../po/list.po';

export class PageAutoscalerEventBase extends Page {

  list: ListComponent;

  constructor(public cfGuid: string, public appGuid: string) {
    super(`/autoscaler/${cfGuid}/${appGuid}/app-autoscaler-scale-history-page`);
    this.list = new ListComponent();
  }

  public static detect(): promise.Promise<PageAutoscalerEventBase> {
    return browser.getCurrentUrl().then(url => {
      if (url.indexOf(browser.baseUrl) === 0) {
        url = url.substr(browser.baseUrl.length + 1);
      }
      const urlParts = url.split('/');
      expect(urlParts.length).toBe(4);
      expect(urlParts[0]).toBe('autoscaler');
      const cfGuid = urlParts[1];
      const appGuid = urlParts[2];
      return new PageAutoscalerEventBase(cfGuid, appGuid);
    });
  }

}
