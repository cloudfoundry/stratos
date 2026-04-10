import { Component, ChangeDetectionStrategy } from '@angular/core';

import { ListComponent, ListConfig } from '@stratosui/core';
import { CfSecurityGroupsListConfigService } from '../../../../shared/components/list/list-types/cf-security-groups/cf-security-groups-list-config.service';

@Component({
  selector: 'app-cloud-foundry-security-groups',
  templateUrl: './cloud-foundry-security-groups.component.html',
  providers: [
    {
      provide: ListConfig,
      useClass: CfSecurityGroupsListConfigService
    }
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListComponent
  ]
})
export class CloudFoundrySecurityGroupsComponent { }
