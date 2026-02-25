import { Component , ChangeDetectionStrategy } from '@angular/core';

import { ListComponent, ListConfig } from '@stratosui/core';
import { CfBuildpacksListConfigService } from '../../../../shared/components/list/list-types/cf-buildpacks/cf-buildpacks-list-config.service';

@Component({
  selector: 'app-cloud-foundry-build-packs',
  templateUrl: './cloud-foundry-build-packs.component.html',
  styleUrls: ['./cloud-foundry-build-packs.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfBuildpacksListConfigService
    }
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListComponent
  ]
})
export class CloudFoundryBuildPacksComponent { }
