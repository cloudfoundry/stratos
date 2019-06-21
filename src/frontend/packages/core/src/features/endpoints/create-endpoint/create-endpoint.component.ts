import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { getIdFromRoute } from '../../cloud-foundry/cf.helpers';
import { getEndpointType } from '../endpoint-helpers';

@Component({
  selector: 'app-create-endpoint',
  templateUrl: './create-endpoint.component.html',
  styleUrls: ['./create-endpoint.component.scss']
})
export class CreateEndpointComponent {

  showConnectStep: boolean;

  constructor(activatedRoute: ActivatedRoute) {
    const epType = getIdFromRoute(activatedRoute, 'type');
    const epSubType = getIdFromRoute(activatedRoute, 'subtype');
    const endpoint = getEndpointType(epType, epSubType);
    this.showConnectStep = !endpoint.doesNotSupportConnect ? endpoint.authTypes && !!endpoint.authTypes.length : false;
  }
}
