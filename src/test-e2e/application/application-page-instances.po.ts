import { by, element } from 'protractor';

import { ListComponent } from '../po/list.po';
import { ApplicationBasePage } from './application-page.po';
import { CardAppInstances } from './po/card-app-instances.po';
import { CardAppStatus } from './po/card-app-status.po';
import { CardAppUptime } from './po/card-app-uptime.po';

export class ApplicationPageInstancesTab extends ApplicationBasePage {

  cardStatus: CardAppStatus;
  cardInstances: CardAppInstances;
  cardUptime: CardAppUptime;
  list: ListComponent;

  constructor(public cfGuid: string, public appGuid: string) {
    super(cfGuid, appGuid, 'instances');
    this.cardStatus = new CardAppStatus();
    this.cardInstances = new CardAppInstances();
    this.cardUptime = new CardAppUptime(element(by.css('app-card-app-usage')));
    this.list = new ListComponent();
  }

}
