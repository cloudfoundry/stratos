import { Component, OnInit } from '@angular/core';

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
export class AddSpaceComponent implements OnInit {

  ogrSpacesUrl: string;
  constructor(
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    const cfId = activeRouteCfOrgSpace.cfGuid;
    const orgId = activeRouteCfOrgSpace.orgGuid;
    this.ogrSpacesUrl = `/cloud-foundry/${cfId}/organizations/${orgId}/spaces`;
  }

  ngOnInit() {
  }

}
