import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store'
import type { GeneralEntityAppState } from '@stratosui/store';;

import type { IListConfig } from '@stratosui/core';
import type { APIResource } from '../../../../../../../../store/src/types/api.types';
import type { CFAppState } from '../../../../../../cf-app-state';
import type { ApplicationService } from '../../../../../../features/applications/application.service';
import { CfEventsConfigService } from '../cf-events-config.service';


@Injectable({
  providedIn: 'root'
})
export class CfAppEventsConfigService extends CfEventsConfigService implements IListConfig<APIResource> {

  constructor(store: Store<GeneralEntityAppState>, appService: ApplicationService) {
    super(
      store,
      appService.cfGuid,
      null,
      null,
      appService.appGuid
    );
  }
}
