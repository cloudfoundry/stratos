import { Component } from '@angular/core';

import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import {
  CfBuildpacksListConfigService,
} from '../../../../shared/components/list/list-types/cf-buildpacks/cf-buildpacks-list-config.service';

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
