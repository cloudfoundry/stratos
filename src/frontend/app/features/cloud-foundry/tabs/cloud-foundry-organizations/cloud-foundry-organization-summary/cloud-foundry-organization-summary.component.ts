import { Component, OnInit } from '@angular/core';

import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import { goToAppWall } from '../../../cf.helpers';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { RecursiveDelete } from '../../../../../store/effects/recusive-entity-delete.effect';
import { entityFactory, organizationSchemaKey } from '../../../../../store/helpers/entity-factory';

@Component({
  selector: 'app-cloud-foundry-organization-summary',
  templateUrl: './cloud-foundry-organization-summary.component.html',
  styleUrls: ['./cloud-foundry-organization-summary.component.scss'],

})
export class CloudFoundryOrganizationSummaryComponent {
  appLink: Function;

  constructor(private store: Store<AppState>, private cfOrgService: CloudFoundryOrganizationService) {
    setTimeout(() => {
      this.store.dispatch(new RecursiveDelete(cfOrgService.orgGuid, entityFactory(organizationSchemaKey)));
    }, 3000);

    this.appLink = () => {
      goToAppWall(store, cfOrgService.cfGuid, cfOrgService.orgGuid);
    };
  }
}
