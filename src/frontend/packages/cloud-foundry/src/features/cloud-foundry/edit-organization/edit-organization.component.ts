import { Component, OnInit } from '@angular/core';

import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';

@Component({
  selector: 'app-edit-organization',
  templateUrl: './edit-organization.component.html',
  styleUrls: ['./edit-organization.component.scss'],
  providers: [getActiveRouteCfOrgSpaceProvider]
})
export class EditOrganizationComponent implements OnInit {

  orgUrl: string;

  constructor(private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
    const { cfGuid, orgGuid } = activeRouteCfOrgSpace;
    this.orgUrl = `/cloud-foundry/${cfGuid}/organizations/${orgGuid}`;
  }

  ngOnInit() {
  }

}
