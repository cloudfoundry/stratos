import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { IListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { CFAppState } from '../../../../../../cf-app-state';
import { ApplicationService } from '../../../../../../features/applications/application.service';
import { CfEventsConfigService } from '../cf-events-config.service';


@Injectable({
  providedIn: 'root'
})
export class CfAppEventsConfigService extends CfEventsConfigService implements IListConfig<APIResource> {

  constructor() {
    const store = inject<Store<CFAppState>>(Store);
    const appService = inject(ApplicationService);

    super(
      store,
      appService.cfGuid,
      null,
      null,
      appService.appGuid
    );
  }
}
