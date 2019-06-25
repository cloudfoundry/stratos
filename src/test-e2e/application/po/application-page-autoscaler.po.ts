import { promise, browser } from 'protractor';

import { ApplicationBasePage } from './application-page.po';
import { CardAppInstances } from './card-app-instances.po';
import { CardAutoscalerStatus } from './card-autoscaler-status.po';
import { CardAutoscalerDefault } from './card-autoscaler-default.po';
import { TableAutoscalerEvents } from './table-autoscaler-events.po';
import { TableAutoscalerTriggers } from './table-autoscaler-triggers';
import { TableAutoscalerSchedules } from './table-autoscaler-schedules';

export class ApplicationPageAutoscalerTab extends ApplicationBasePage {

  cardInstances: CardAppInstances;
  cardStatus: CardAutoscalerStatus;
  cardDefault: CardAutoscalerDefault;
  tableEvents: TableAutoscalerEvents;
  tableTriggers: TableAutoscalerTriggers;
  tableSchedules: TableAutoscalerSchedules;

  constructor(public cfGuid: string, public appGuid: string) {
    super(cfGuid, appGuid, 'autoscale');
    this.cardStatus = new CardAutoscalerStatus(cfGuid, appGuid);
    this.cardInstances = new CardAppInstances();
    this.cardDefault = new CardAutoscalerDefault(cfGuid, appGuid);
    this.tableEvents = new TableAutoscalerEvents();
    this.tableTriggers = new TableAutoscalerTriggers(cfGuid, appGuid);
    this.tableSchedules = new TableAutoscalerSchedules(cfGuid, appGuid);
  }

  public static detect(): promise.Promise<ApplicationPageAutoscalerTab> {
    return browser.getCurrentUrl().then(url => {
      if (url.indexOf(browser.baseUrl) === 0) {
        url = url.substr(browser.baseUrl.length + 1);
      }
      const urlParts = url.split('/');
      expect(urlParts.length).toBe(4);
      expect(urlParts[0]).toBe('applications');
      expect(urlParts[3]).toBe('autoscale');
      const cfGuid = urlParts[1];
      const appGuid = urlParts[2];
      return new ApplicationPageAutoscalerTab(cfGuid, appGuid);
    });
  }
}
