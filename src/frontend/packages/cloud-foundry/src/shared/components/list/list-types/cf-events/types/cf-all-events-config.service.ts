import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import type { IListConfig } from '@stratosui/core';
import type { APIResource , GeneralEntityAppState } from '@stratosui/store';
import type { CFAppState } from '../../../../../../cf-app-state';
import type { CloudFoundryEndpointService } from '../../../../../../features/cf/services/cloud-foundry-endpoint.service';
import { CfEventsConfigService } from '../cf-events-config.service';


@Injectable({
  providedIn: 'root'
})
export class CfAllEventsConfigService extends CfEventsConfigService implements IListConfig<APIResource> {

  constructor(store: Store<GeneralEntityAppState>, cfService: CloudFoundryEndpointService) {
    super(
      store,
      cfService.cfGuid,
    );
  }
}
