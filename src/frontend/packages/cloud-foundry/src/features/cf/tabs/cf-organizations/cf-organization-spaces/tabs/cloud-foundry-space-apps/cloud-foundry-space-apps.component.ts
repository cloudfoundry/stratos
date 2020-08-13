import { Component } from '@angular/core';

import { ListConfig } from '../../../../../../../../../core/src/shared/components/list/list.component.types';
import {
  CfSpaceAppsListConfigService,
} from '../../../../../../../shared/components/list/list-types/cf-space-apps/cf-space-apps-list-config.service';

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
