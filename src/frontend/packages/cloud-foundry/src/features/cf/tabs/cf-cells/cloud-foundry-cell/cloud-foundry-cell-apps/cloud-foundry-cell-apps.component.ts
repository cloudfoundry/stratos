import { Component, ChangeDetectionStrategy } from '@angular/core';

import { ListComponent, ListConfig } from '@stratosui/core';
import { CfCellAppsListConfigService } from '../../../../../../shared/components/list/list-types/cf-cell-apps/cf-cell-apps-list-config.service';

@Component({
  selector: 'app-cloud-foundry-cell-apps',
  templateUrl: './cloud-foundry-cell-apps.component.html',
  styleUrls: ['./cloud-foundry-cell-apps.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfCellAppsListConfigService
    }
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListComponent
  ]
})
export class CloudFoundryCellAppsComponent { }
