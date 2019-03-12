import { Component } from '@angular/core';

import {
  CfSpaceAppsListConfigService,
} from '../../../../../../../shared/components/list/list-types/cf-space-apps/cf-space-apps-list-config.service';
import { ListConfig } from '../../../../../../../shared/components/list/list.component.types';

@Component({
  selector: 'app-cloud-foundry-space-apps',
  templateUrl: './cloud-foundry-space-apps.component.html',
  styleUrls: ['./cloud-foundry-space-apps.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfSpaceAppsListConfigService
    }
  ]
})
export class CloudFoundrySpaceAppsComponent { }
