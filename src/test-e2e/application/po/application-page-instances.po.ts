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

  parseUptime(s: string) {
    let uptime = 0;
    const parts = s.split(' ');
    parts.forEach(p => {
      if (p.endsWith('s')) {
        uptime += this.getTime(p);
      } else if (p.endsWith('m')) {
        uptime += this.getTime(p) * 60;
      }
    });
    return uptime;
  }

  private getTime(str: string) {
    const v = str.substr(0, str.length - 1);
    return parseInt(v, 10);
  }

  getUptime(index: number) {
    // Get the uptime for the instance
    return this.list.table.getTableDataRaw().then(table => {
      if (index <= (table.rows.length - 1)) {
        const row = table.rows[index];
        return this.parseUptime(row[5]);
      }
      return -1;
    });
  }
}
