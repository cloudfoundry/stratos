import { Component } from '@angular/core';

import {
  CfSecurityGroupsListConfigService,
} from '../../../../shared/components/list/list-types/cf-security-groups/cf-security-groups-list-config.service';
import { ListConfig } from '../../../../shared/components/list/list.component.types';

@Component({
  selector: 'app-cloud-foundry-security-groups',
  templateUrl: './cloud-foundry-security-groups.component.html',
  styleUrls: ['./cloud-foundry-security-groups.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfSecurityGroupsListConfigService
    }
  ]
})
export class CloudFoundrySecurityGroupsComponent { }
