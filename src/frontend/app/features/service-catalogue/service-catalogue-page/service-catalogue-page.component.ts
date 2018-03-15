import { Component, OnInit } from '@angular/core';

import { ListDataSource } from '../../../shared/components/list/data-sources-controllers/list-data-source';
import {
  CfServicesListConfigService,
} from '../../../shared/components/list/list-types/cf-services/cf-services-list-config.service';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { APIResource } from '../../../store/types/api.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cloud-foundry/cf.helpers';

@Component({
  selector: 'app-service-catalogue-page',
  templateUrl: './service-catalogue-page.component.html',
  styleUrls: ['./service-catalogue-page.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    {
      provide: ListConfig,
      useClass: CfServicesListConfigService
    }
  ]
})
export class ServiceCataloguePageComponent implements OnInit {

  constructor(private listConfig: ListConfig<APIResource>) {
    const dataSource: ListDataSource<APIResource> = listConfig.getDataSource();
  }
  ngOnInit() {
  }
}
