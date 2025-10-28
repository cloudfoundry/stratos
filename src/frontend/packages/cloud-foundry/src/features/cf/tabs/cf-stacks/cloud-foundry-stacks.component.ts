import { Component } from '@angular/core';

import { ListComponent } from '../../../../../../core/src/shared/components/list/list.component';
import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import {
  CfStacksListConfigService,
} from '../../../../shared/components/list/list-types/cf-stacks/cf-stacks-list-config.service';

@Component({
  selector: 'app-cloud-foundry-stacks',
  templateUrl: './cloud-foundry-stacks.component.html',
  styleUrls: ['./cloud-foundry-stacks.component.scss'],
  standalone: true,
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
