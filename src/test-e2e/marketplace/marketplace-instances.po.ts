import { ListComponent } from '../po/list.po';
import { Page } from '../po/page.po';

export class MarketplaceInstancesPage extends Page {
  public list = new ListComponent();

  constructor(cfGuid: string, serviceGuid: string) {
    super(`/marketplace/${cfGuid}/${serviceGuid}/instances`);
  }

}
