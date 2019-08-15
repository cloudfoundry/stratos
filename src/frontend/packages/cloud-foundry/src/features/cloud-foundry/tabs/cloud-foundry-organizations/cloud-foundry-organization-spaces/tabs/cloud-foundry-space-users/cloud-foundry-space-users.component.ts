import { Component } from '@angular/core';

import { ListConfig } from '../../../../../../../../../core/src/shared/components/list/list.component.types';
import {
  CfSpaceUsersListConfigService,
} from '../../../../../../../shared/components/list/list-types/cf-space-users/cf-space-users-list-config.service';

@Component({
  selector: 'app-cloud-foundry-space-users',
  templateUrl: './cloud-foundry-space-users.component.html',
  styleUrls: ['./cloud-foundry-space-users.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfSpaceUsersListConfigService
  }]
})
export class CloudFoundrySpaceUsersComponent { }
