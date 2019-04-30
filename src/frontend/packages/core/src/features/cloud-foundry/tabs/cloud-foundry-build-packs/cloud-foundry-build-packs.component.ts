import { Component } from '@angular/core';

import {
  CfBuildpacksListConfigService,
} from '../../../../shared/components/list/list-types/cf-buildpacks/cf-buildpacks-list-config.service';
import { ListConfig } from '../../../../shared/components/list/list.component.types';

@Component({
  selector: 'app-cloud-foundry-build-packs',
  templateUrl: './cloud-foundry-build-packs.component.html',
  styleUrls: ['./cloud-foundry-build-packs.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfBuildpacksListConfigService
    }
  ]
})
export class CloudFoundryBuildPacksComponent { }
