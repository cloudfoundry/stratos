import { Component } from '@angular/core';

import { EndpointsService } from '../../../core/endpoints.service';
import {
  EndpointsListConfigService,
} from '../../../shared/components/list/list-types/endpoint/endpoints-list-config.service';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { CurrentUserPermissions } from '../../../core/current-user-permissions.config';
import { of } from 'rxjs';


@Component({
  selector: 'app-endpoints-page',
  templateUrl: './endpoints-page.component.html',
  styleUrls: ['./endpoints-page.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: EndpointsListConfigService,
  }]
})

export class EndpointsPageComponent {
  public canRegisterEndpoint = CurrentUserPermissions.ENDPOINT_REGISTER;
  constructor(public endpointsService: EndpointsService) { }
}
