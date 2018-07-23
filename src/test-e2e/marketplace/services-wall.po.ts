import { Page } from '../po/page.po';
import { ListComponent } from '../po/list.po';

export class ServicesWall extends Page {

  servicesList = new ListComponent();
  constructor() {
    super('/services');
  }
}
