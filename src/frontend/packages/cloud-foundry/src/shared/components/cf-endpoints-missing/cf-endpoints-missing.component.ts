import { Component } from '@angular/core';

import { EndpointsService } from '../../../../../core/src/core/endpoints.service';
import {
  EndpointMissingMessageParts,
  EndpointsMissingComponent,
} from '../../../../../core/src/shared/components/endpoints-missing/endpoints-missing.component';
import { CloudFoundryService } from '../../data-services/cloud-foundry.service';

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

  constructor(cloudFoundryService: CloudFoundryService, endpointsService: EndpointsService) {
    super(endpointsService);
    this.haveConnected$ = cloudFoundryService.hasConnectedCFEndpoints$;
    this.haveRegistered$ = cloudFoundryService.hasRegisteredCFEndpoints$;
  }

}
