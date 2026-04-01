import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { IListConfig } from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { CFAppState } from '../../../../../../cf-app-state';
import { CloudFoundrySpaceService } from '../../../../../../features/cf/services/cloud-foundry-space.service';
import { CfEventsConfigService } from '../cf-events-config.service';


@Injectable({
  providedIn: 'root'
})
export class CfSpaceEventsConfigService extends CfEventsConfigService implements IListConfig<APIResource> {

  constructor() {
    const store = inject<Store<CFAppState>>(Store);
    const spaceService = inject(CloudFoundrySpaceService);

    super(
      store,
      spaceService.cfGuid,
      null,
      spaceService.spaceGuid
    );
  }
}
