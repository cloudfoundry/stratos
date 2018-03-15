import { Component, OnInit } from '@angular/core';

import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import {
  CfBuildpackCardComponent,
} from '../../../../shared/components/list/list-types/cf-buildpacks/cf-buildpack-card/cf-buildpack-card.component';
import {
  CfBuildpacksListConfigService,
} from '../../../../shared/components/list/list-types/cf-buildpacks/cf-buildpacks-list-config.service';
import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { APIResource } from '../../../../store/types/api.types';

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
export class CloudFoundryBuildPacksComponent {
  constructor(private listConfig: ListConfig<APIResource>) {
    const dataSource: ListDataSource<APIResource> = listConfig.getDataSource();
  }
}
