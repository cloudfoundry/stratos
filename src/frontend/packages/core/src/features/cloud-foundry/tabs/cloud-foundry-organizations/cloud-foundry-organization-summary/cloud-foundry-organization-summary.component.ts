import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { goToAppWall } from '../../../cf.helpers';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import { AppState } from '../../../../../../../store/src/app-state';

@Component({
  selector: 'app-cloud-foundry-organization-summary',
  templateUrl: './cloud-foundry-organization-summary.component.html',
  styleUrls: ['./cloud-foundry-organization-summary.component.scss'],

})
export class CloudFoundryOrganizationSummaryComponent {
  appLink: Function;

  constructor(private store: Store<AppState>, public cfOrgService: CloudFoundryOrganizationService) {
    this.appLink = () => {
      goToAppWall(store, cfOrgService.cfGuid, cfOrgService.orgGuid);
    };
  }
}
