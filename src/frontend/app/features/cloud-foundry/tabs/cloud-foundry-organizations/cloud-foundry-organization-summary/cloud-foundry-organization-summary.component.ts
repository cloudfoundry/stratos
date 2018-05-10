import { Component, OnInit } from '@angular/core';

import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import { goToAppWall } from '../../../cf.helpers';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';

@Component({
  selector: 'app-cloud-foundry-organization-summary',
  templateUrl: './cloud-foundry-organization-summary.component.html',
  styleUrls: ['./cloud-foundry-organization-summary.component.scss'],

})
export class CloudFoundryOrganizationSummaryComponent {
  appLink: Function;

  constructor(private store: Store<AppState>, private cfOrgService: CloudFoundryOrganizationService) {
    this.appLink = () => {
      goToAppWall(store, cfOrgService.cfGuid, cfOrgService.orgGuid);
    };
  }
}
