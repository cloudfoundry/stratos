import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { entityCatalogue } from '../../../core/entity-catalogue/entity-catalogue.service';
import { getIdFromRoute } from '../../../core/utils.service';

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
    const endpoint = entityCatalogue.getEndpoint(epType, epSubType);
    this.showConnectStep = !endpoint.definition.unConnectable ?
      endpoint.definition.authTypes && !!endpoint.definition.authTypes.length :
      false;
  }
}
