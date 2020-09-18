import { Component } from '@angular/core';

import { ListConfig } from '../../../../../../../../core/src/shared/components/list/list.component.types';
import {
  CfCellAppsListConfigService,
} from '../../../../../../shared/components/list/list-types/cf-cell-apps/cf-cell-apps-list-config.service';

@Component({
  selector: 'app-cloud-foundry-cell-apps',
  templateUrl: './cloud-foundry-cell-apps.component.html',
  styleUrls: ['./cloud-foundry-cell-apps.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfCellAppsListConfigService
    }
  ]
})
export class CloudFoundryCellAppsComponent { }
