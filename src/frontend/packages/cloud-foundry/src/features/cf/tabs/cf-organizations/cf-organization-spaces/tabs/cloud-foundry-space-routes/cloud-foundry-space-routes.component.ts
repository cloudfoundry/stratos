import { Component , ChangeDetectionStrategy } from '@angular/core';

import { ListComponent, ListConfig } from '@stratosui/core';
import { CfSpaceRoutesListConfigService } from '../../../../../../../shared/components/list/list-types/cf-space-routes/cf-space-routes-list-config.service';

@Component({
  selector: 'app-cloud-foundry-space-routes',
  templateUrl: './cloud-foundry-space-routes.component.html',
  styleUrls: ['./cloud-foundry-space-routes.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
