import { Component, OnInit } from '@angular/core';

import { IFeatureFlag } from '../../../../core/cf-api.types';
import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import {
  CfFeatureFlagsListConfigService,
} from '../../../../shared/components/list/list-types/cf-feature-flags/cf-feature-flags-list-config.service';
import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { APIResource } from '../../../../store/types/api.types';

@Component({
  selector: 'app-cloud-foundry-feature-flags',
  templateUrl: './cloud-foundry-feature-flags.component.html',
  styleUrls: ['./cloud-foundry-feature-flags.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfFeatureFlagsListConfigService
    }
  ]
})
export class CloudFoundryFeatureFlagsComponent implements OnInit {

  constructor(private listConfig: ListConfig<IFeatureFlag>) {
    const dataSource: ListDataSource<IFeatureFlag> = listConfig.getDataSource();
  }

  ngOnInit() {
  }

}
