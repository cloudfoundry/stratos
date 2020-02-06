import { ListComponent } from '../../po/list.po';
import { ApplicationBasePage } from './application-page.po';

export class ApplicationPageEventsTab extends ApplicationBasePage {

  list: ListComponent;

  constructor(public cfGuid: string, public appGuid: string) {
    super(cfGuid, appGuid, 'events');
    this.list = new ListComponent();
  }

}
