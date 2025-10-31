import { Component , ChangeDetectionStrategy } from '@angular/core';

import { ListComponent } from '../../../../../../../../../core/src/shared/components/list/list.component';
import { ListConfig } from '../../../../../../../../../core/src/shared/components/list/list.component.types';
import {
  CfSpaceAppsListConfigService,
} from '../../../../../../../shared/components/list/list-types/cf-space-apps/cf-space-apps-list-config.service';

@Component({
  selector: 'app-cloud-foundry-space-apps',
  templateUrl: './cloud-foundry-space-apps.component.html',
  styleUrls: ['./cloud-foundry-space-apps.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListComponent
  ],
  providers: [
    {
      provide: ListConfig,
      useClass: CfSpaceAppsListConfigService
    }
  ]
})
export class CloudFoundrySpaceAppsComponent { }
