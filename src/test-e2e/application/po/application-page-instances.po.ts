import { ListComponent } from '../../po/list.po';
import { ApplicationBasePage } from './application-page.po';
import { CardAppInstances } from './card-app-instances.po';
import { CardAppStatus } from './card-app-status.po';
import { CardAppUsage } from './card-app-usage.po';

export class ApplicationPageInstancesTab extends ApplicationBasePage {

  cardStatus: CardAppStatus;
  cardInstances: CardAppInstances;
  cardUsage: CardAppUsage;
  list: ListComponent;

  constructor(public cfGuid: string, public appGuid: string) {
    super(cfGuid, appGuid, 'instances');
    this.cardStatus = new CardAppStatus();
    this.cardInstances = new CardAppInstances();
    this.cardUsage = new CardAppUsage();
    this.list = new ListComponent();
  }

}
