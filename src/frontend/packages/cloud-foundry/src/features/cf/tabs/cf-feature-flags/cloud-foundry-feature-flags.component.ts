import { Component } from '@angular/core';

import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import {
  CfFeatureFlagsListConfigService,
} from '../../../../shared/components/list/list-types/cf-feature-flags/cf-feature-flags-list-config.service';

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
