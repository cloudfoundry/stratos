import { Component } from '@angular/core';

import {
  CfFeatureFlagsListConfigService,
} from '../../../../shared/components/list/list-types/cf-feature-flags/cf-feature-flags-list-config.service';
import { ListConfig } from '../../../../shared/components/list/list.component.types';

@Component({
  selector: 'app-cloud-foundry-feature-flags',
  templateUrl: './cloud-foundry-feature-flags.component.html',
  styleUrls: ['./cloud-foundry-feature-flags.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfFeatureFlagsListConfigService
    }
  ]
})
export class CloudFoundryFeatureFlagsComponent { }
