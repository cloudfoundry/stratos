import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import {
  type EndpointMissingMessageParts,
  EndpointsMissingComponent,
} from '../../../../../core/src/shared/components/endpoints-missing/endpoints-missing.component';
import { CloudFoundryService } from '../../data-services/cloud-foundry.service';
import { NoContentMessageComponent } from '@stratosui/core';

@Component({
selector: 'app-cf-endpoints-missing',
  templateUrl: './cf-endpoints-missing.component.html',
  styleUrls: ['./cf-endpoints-missing.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, NoContentMessageComponent]
})
export class CfEndpointsMissingComponent extends EndpointsMissingComponent {

  protected override noneRegisteredText: EndpointMissingMessageParts = {
    firstLine: 'There are no registered Cloud Foundry endpoints',
    secondLine: {
      text: 'Use the Endpoints view to register'
    },
  };

  protected override noneConnectedText: EndpointMissingMessageParts = {
    firstLine: 'There are no connected Cloud Foundry endpoints',
    secondLine: {
      text: 'Use the Endpoints view to connect'
    },
  };

  override showToolbarHint = false;
  protected override showNoConnected = true;

  constructor(cloudFoundryService: CloudFoundryService) {
    super();
    this.haveConnected$ = cloudFoundryService.hasConnectedCFEndpoints$;
    this.haveRegistered$ = cloudFoundryService.hasRegisteredCFEndpoints$;
  }

}
