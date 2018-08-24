import { browser, by, element } from 'protractor';

import { ListComponent } from '../../po/list.po';
import { MetaDataItemComponent } from '../../po/meta-data-time.po';
import { CFPage } from '../../po/cf-page.po';


export class CfOrgLevelPage extends CFPage {

  static forEndpoint(guid: string, orgGuid): CfOrgLevelPage {
    const page = new CfOrgLevelPage();
    page.navLink = '/cloud-foundry/' + guid + '/organizations/' + orgGuid;
    return page;
  }

  goToSummaryTab() {
    return this.goToTab('Summary', 'summary');
  }

  goToSpacesTab() {
    return this.goToTab('Spaces', 'spaces');
  }

  goToUsersTab() {
    return this.goToTab('Users', 'users');
  }

  private goToTab(label: string, urlSuffix: string) {
    return this.subHeader.goToItemAndWait(label, this.navLink, urlSuffix);
  }

}
