import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';

function getCfIdFromUrl(activatedRoute: ActivatedRoute) {
  return {
    guid: activatedRoute.snapshot.params.cfId
  };
}
@Component({
  selector: 'app-cloud-foundry-base',
  templateUrl: './cloud-foundry-base.component.html',
  styleUrls: ['./cloud-foundry-base.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CfUserService,
    CloudFoundryEndpointService
  ]
})
export class CloudFoundryBaseComponent implements OnInit {
  constructor() { }

  ngOnInit() { }
}
