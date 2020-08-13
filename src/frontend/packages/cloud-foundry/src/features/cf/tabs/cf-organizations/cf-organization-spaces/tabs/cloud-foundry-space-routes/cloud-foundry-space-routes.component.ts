import { Component } from '@angular/core';

import { ListConfig } from '../../../../../../../../../core/src/shared/components/list/list.component.types';
import {
  CfSpaceRoutesListConfigService,
} from '../../../../../../../shared/components/list/list-types/cf-space-routes/cf-space-routes-list-config.service';

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
