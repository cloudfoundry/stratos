import { Component } from '@angular/core';

import { ListComponent } from '../../../../../../../../../core/src/shared/components/list/list.component';
import { ListConfig } from '../../../../../../../../../core/src/shared/components/list/list.component.types';
import {
  CfSpaceRoutesListConfigService,
} from '../../../../../../../shared/components/list/list-types/cf-space-routes/cf-space-routes-list-config.service';

@Component({
  selector: 'app-cloud-foundry-space-routes',
  templateUrl: './cloud-foundry-space-routes.component.html',
  styleUrls: ['./cloud-foundry-space-routes.component.scss'],
  standalone: true,
  imports: [
    ListComponent
  ],
  providers: [
    {
      provide: ListConfig,
      useClass: CfSpaceRoutesListConfigService
    }
  ]
})
export class CloudFoundrySpaceRoutesComponent { }
