import { ListComponent } from '../../po/list.po';
import { ApplicationBasePage } from './application-page.po';

export class ApplicationPageVariablesTab extends ApplicationBasePage {

  list: ListComponent;

  constructor(public cfGuid: string, public appGuid: string) {
    super(cfGuid, appGuid, 'variables');
    this.list = new ListComponent();
  }

}
