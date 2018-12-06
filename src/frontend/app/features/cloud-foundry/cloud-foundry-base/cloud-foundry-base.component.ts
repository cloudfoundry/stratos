import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';

function getCfIdFromUrl(activatedRoute: ActivatedRoute) {
  return {
    guid: activatedRoute.snapshot.params.endpointId
  };
}
@Component({
  selector: 'app-cloud-foundry-base',
  templateUrl: './cloud-foundry-base.component.html',
  styleUrls: ['./cloud-foundry-base.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CfUserService,
    CloudFoundryEndpointService,
  ]
})
export class CloudFoundryBaseComponent { }
