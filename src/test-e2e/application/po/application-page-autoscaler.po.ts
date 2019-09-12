import { promise, browser } from 'protractor';

import { ApplicationBasePage } from './application-page.po';
import { MessageNoAutoscalePolicy } from './message-no-autoscaler-policy';
import { BannerAutoscalerTab } from './banner-autoscaler-tab';
import { CardAutoscalerDefault } from './card-autoscaler-default.po';
import { CardAutoscalerMetric } from './card-autoscaler-metric';
import { TableAutoscalerEvents } from './table-autoscaler-events.po';
import { TableAutoscalerTriggers } from './table-autoscaler-triggers';
import { TableAutoscalerSchedules } from './table-autoscaler-schedules';

export class ApplicationPageAutoscalerTab extends ApplicationBasePage {

  bannerAutoscalerTab: BannerAutoscalerTab;
  messageNoPolicy: MessageNoAutoscalePolicy;
  cardDefault: CardAutoscalerDefault;
  cardMetric: CardAutoscalerMetric;
  tableTriggers: TableAutoscalerTriggers;
  tableSchedules: TableAutoscalerSchedules;
  tableEvents: TableAutoscalerEvents;

  constructor(public cfGuid: string, public appGuid: string) {
    super(cfGuid, appGuid, 'autoscale');
    this.messageNoPolicy = new MessageNoAutoscalePolicy();
    this.bannerAutoscalerTab = new BannerAutoscalerTab(cfGuid, appGuid);
    this.cardDefault = new CardAutoscalerDefault(cfGuid, appGuid);
    this.cardMetric = new CardAutoscalerMetric(cfGuid, appGuid);
    this.tableEvents = new TableAutoscalerEvents(cfGuid, appGuid);
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
