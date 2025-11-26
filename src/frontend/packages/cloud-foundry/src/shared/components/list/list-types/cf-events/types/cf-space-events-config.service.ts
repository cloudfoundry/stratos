import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import type { IListConfig } from '@stratosui/core';
import type { APIResource , GeneralEntityAppState } from '@stratosui/store';
import type { CFAppState } from '../../../../../../cf-app-state';
import type { CloudFoundrySpaceService } from '../../../../../../features/cf/services/cloud-foundry-space.service';
import { CfEventsConfigService } from '../cf-events-config.service';


@Injectable({
  providedIn: 'root'
})
export class CfSpaceEventsConfigService extends CfEventsConfigService implements IListConfig<APIResource> {

  constructor(store: Store<GeneralEntityAppState>, spaceService: CloudFoundrySpaceService) {
    super(
      store,
      spaceService.cfGuid,
      null,
      spaceService.spaceGuid
    );
  }
}
