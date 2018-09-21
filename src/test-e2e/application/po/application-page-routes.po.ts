import { ListComponent } from '../../po/list.po';
import { ApplicationBasePage } from './application-page.po';

export class ApplicationPageRoutesTab extends ApplicationBasePage {

  list: ListComponent;

  constructor(public cfGuid: string, public appGuid: string) {
    super(cfGuid, appGuid, 'routes');
    this.list = new ListComponent();
  }

}
