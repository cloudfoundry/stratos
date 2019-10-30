import { Component } from '@angular/core';

import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';


@Component({
  selector: 'app-add-space',
  templateUrl: './add-space.component.html',
  styleUrls: ['./add-space.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ]

})
export class AddSpaceComponent {

  ogrSpacesUrl: string;
  constructor(
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    const cfId = activeRouteCfOrgSpace.cfGuid;
    const orgId = activeRouteCfOrgSpace.orgGuid;
    this.ogrSpacesUrl = `/cloud-foundry/${cfId}/organizations/${orgId}/spaces`;
  }

}
