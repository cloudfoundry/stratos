import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { IListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { CFAppState } from '../../../../../../cf-app-state';
import { CloudFoundryOrganizationService } from '../../../../../../features/cf/services/cloud-foundry-organization.service';
import { CfEventsConfigService } from '../cf-events-config.service';


@Injectable()
export class CfOrganizationEventsConfigService extends CfEventsConfigService implements IListConfig<APIResource> {

  constructor(store: Store<CFAppState>, orgService: CloudFoundryOrganizationService) {
    super(
      store,
      orgService.cfGuid,
      orgService.orgGuid,
    );
  }
}
