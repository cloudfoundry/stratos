import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { EndpointsService } from '../../../core/endpoints.service';
import { CloudFoundryService } from '../../data-services/cloud-foundry.service';
import { EndpointMissingMessageParts, EndpointsMissingComponent } from '../endpoints-missing/endpoints-missing.component';


@Component({
  selector: 'app-cf-endpoints-missing',
  templateUrl: './cf-endpoints-missing.component.html',
  styleUrls: ['./cf-endpoints-missing.component.scss']
})
export class CfEndpointsMissingComponent extends EndpointsMissingComponent {

  noneRegisteredText: EndpointMissingMessageParts = {
    firstLine: 'There are no registered Cloud Foundry endpoints',
    secondLine: {
      text: 'Use the Endpoints view to register'
    },
  };

  noneConnectedText: EndpointMissingMessageParts = {
    firstLine: 'There are no connected Cloud Foundry endpoints',
    secondLine: {
      text: 'Use the Endpoints view to connect'
    },
  };

  showToolbarHint = false;
  showNoConnected = true;

  constructor(snackBar: MatSnackBar, cloudFoundryService: CloudFoundryService, endpointsService: EndpointsService) {
    super(snackBar, endpointsService);
    this.haveConnected$ = cloudFoundryService.hasConnectedCFEndpoints$;
    this.haveRegistered$ = cloudFoundryService.hasRegisteredCFEndpoints$;
  }

}
