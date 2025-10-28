import { Component } from '@angular/core';

import { ListComponent } from '../../../../../../core/src/shared/components/list/list.component';
import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import {
  CfSecurityGroupsListConfigService,
} from '../../../../shared/components/list/list-types/cf-security-groups/cf-security-groups-list-config.service';

@Component({
  selector: 'app-cloud-foundry-security-groups',
  templateUrl: './cloud-foundry-security-groups.component.html',
  styleUrls: ['./cloud-foundry-security-groups.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfSecurityGroupsListConfigService
    }
  ],
  standalone: true,
  imports: [
    ListComponent
  ]
})
export class CloudFoundrySecurityGroupsComponent { }
