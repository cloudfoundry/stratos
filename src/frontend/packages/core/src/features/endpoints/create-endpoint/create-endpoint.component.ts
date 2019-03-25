import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IRouterNavPayload } from '../../../../../store/src/actions/router.actions';
import {
  BASE_REDIRECT_QUERY,
} from '../../../shared/components/add-service-instance/add-service-instance-base-step/add-service-instance.types';

@Component({
  selector: 'app-create-endpoint',
  templateUrl: './create-endpoint.component.html',
  styleUrls: ['./create-endpoint.component.scss']
})
export class CreateEndpointComponent {
  public basePreviousRedirect: IRouterNavPayload;

  constructor(route: ActivatedRoute) {
    this.basePreviousRedirect = route.snapshot.queryParams[BASE_REDIRECT_QUERY] ? {
      path: 'endpoints/new'
    } : null;
  }
}
