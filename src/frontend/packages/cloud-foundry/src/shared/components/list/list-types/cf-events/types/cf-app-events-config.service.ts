import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { IListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { CFAppState } from '../../../../../../cf-app-state';
import { ApplicationService } from '../../../../../services/application.service';
import { CfEventsConfigService } from '../cf-events-config.service';


@Injectable()
export class CfAppEventsConfigService extends CfEventsConfigService implements IListConfig<APIResource> {

  constructor(store: Store<CFAppState>, appService: ApplicationService) {
    super(
      store,
      appService.cfGuid,
      null,
      null,
      appService.appGuid
    );
  }
}
