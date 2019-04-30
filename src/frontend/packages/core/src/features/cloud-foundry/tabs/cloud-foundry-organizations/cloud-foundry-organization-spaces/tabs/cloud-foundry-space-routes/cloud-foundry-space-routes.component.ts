import { Component } from '@angular/core';

import {
  CfSpaceRoutesListConfigService,
} from '../../../../../../../shared/components/list/list-types/cf-space-routes/cf-space-routes-list-config.service';
import { ListConfig } from '../../../../../../../shared/components/list/list.component.types';

@Component({
  selector: 'app-cloud-foundry-space-routes',
  templateUrl: './cloud-foundry-space-routes.component.html',
  styleUrls: ['./cloud-foundry-space-routes.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfSpaceRoutesListConfigService
    }
  ]
})
export class CloudFoundrySpaceRoutesComponent { }
