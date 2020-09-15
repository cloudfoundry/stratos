import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { IListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { CFAppState } from '../../../../../../cf-app-state';
import { CloudFoundryEndpointService } from '../../../../../../features/cf/services/cloud-foundry-endpoint.service';
import { CfEventsConfigService } from '../cf-events-config.service';


@Injectable()
export class CfAllEventsConfigService extends CfEventsConfigService implements IListConfig<APIResource> {

  constructor(store: Store<CFAppState>, cfService: CloudFoundryEndpointService) {
    super(
      store,
      cfService.cfGuid,
    );
  }
}
