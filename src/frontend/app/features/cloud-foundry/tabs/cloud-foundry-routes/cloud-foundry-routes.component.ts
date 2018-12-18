import { Component } from '@angular/core';

import {
  CfRoutesListConfigService,
} from '../../../../shared/components/list/list-types/cf-routes/cf-routes-list-config.service';
import { ListConfig } from '../../../../shared/components/list/list.component.types';

@Component({
  selector: 'app-cloud-foundry-routes',
  templateUrl: './cloud-foundry-routes.component.html',
  styleUrls: ['./cloud-foundry-routes.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfRoutesListConfigService
    }
  ]
})
export class CloudFoundryRoutesComponent { }
