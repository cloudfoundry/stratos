import { Component } from '@angular/core';

import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import {
  CfRoutesListConfigService,
} from '../../../../shared/components/list/list-types/cf-routes/cf-routes-list-config.service';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';

@Component({
  selector: 'app-cloud-foundry-routes',
  templateUrl: './cloud-foundry-routes.component.html',
  styleUrls: ['./cloud-foundry-routes.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfRoutesListConfigService
    },
    CfOrgSpaceDataService
  ]
})
export class CloudFoundryRoutesComponent { }
