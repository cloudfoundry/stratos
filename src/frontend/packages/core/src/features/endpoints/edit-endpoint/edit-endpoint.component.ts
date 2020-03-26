import { Component, Injectable } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { getIdFromRoute } from '../../../core/utils.service';

@Injectable()
export class ActvieEndpoint {
  endpointID: string;
}

@Component({
  selector: 'app-edit-endpoint',
  templateUrl: './edit-endpoint.component.html',
  styleUrls: ['./edit-endpoint.component.scss'],
  providers: []
})
export class EditEndpointComponent {

  cancelUrl = '/endpoints';

  constructor(activatedRoute: ActivatedRoute) {
    const endpointID = getIdFromRoute(activatedRoute, 'endpointId');
    console.log(endpointID);
  }

}
