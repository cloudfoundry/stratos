import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { BaseCF } from './../cf-page.types';

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
    {
      provide: BaseCF,
      useFactory: getCfIdFromUrl,
      deps: [
        ActivatedRoute
      ]
    },
    CfUserService,
    CloudFoundryEndpointService
  ]
})
export class CloudFoundryBaseComponent implements OnInit {
  constructor() { }

  ngOnInit() { }
}
