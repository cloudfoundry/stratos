import { DatePipe } from '@angular/common';
import { Component , ChangeDetectionStrategy } from '@angular/core';

import { ListComponent, ListConfig } from '@stratosui/core';
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
    CfOrgSpaceDataService,
    DatePipe
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListComponent
  ]
})
export class CloudFoundryRoutesComponent { }
