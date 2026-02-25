import { Component , ChangeDetectionStrategy } from '@angular/core';

import { ListComponent, ListConfig } from '@stratosui/core';
import { CfStacksListConfigService } from '../../../../shared/components/list/list-types/cf-stacks/cf-stacks-list-config.service';

@Component({
  selector: 'app-cloud-foundry-stacks',
  templateUrl: './cloud-foundry-stacks.component.html',
  styleUrls: ['./cloud-foundry-stacks.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListComponent
  ],
  providers: [
    {
      provide: ListConfig,
      useClass: CfStacksListConfigService
    }
  ]
})
export class CloudFoundryStacksComponent { }
