import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { IListConfig } from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { CFAppState } from '../../../../../../cf-app-state';
import { CloudFoundryEndpointService } from '../../../../../../features/cf/services/cloud-foundry-endpoint.service';
import { CfEventsConfigService } from '../cf-events-config.service';


@Injectable({
  providedIn: 'root'
})
export class CfAllEventsConfigService extends CfEventsConfigService implements IListConfig<APIResource> {

  constructor(store: Store<CFAppState>, cfService: CloudFoundryEndpointService) {
    super(
      store,
      cfService.cfGuid,
    );
  }
}
