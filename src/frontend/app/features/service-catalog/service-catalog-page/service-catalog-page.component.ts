import { Component, OnInit } from '@angular/core';

import { ListDataSource } from '../../../shared/components/list/data-sources-controllers/list-data-source';
import {
  CfServicesListConfigService,
} from '../../../shared/components/list/list-types/cf-services/cf-services-list-config.service';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { APIResource } from '../../../store/types/api.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cloud-foundry/cf.helpers';

@Component({
  selector: 'app-service-catalog-page',
  templateUrl: './service-catalog-page.component.html',
  styleUrls: ['./service-catalog-page.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    {
      provide: ListConfig,
      useClass: CfServicesListConfigService
    }
  ]
})
export class ServiceCatalogPageComponent implements OnInit {

  constructor(private listConfig: ListConfig<APIResource>, public cloudFoundryService: CloudFoundryService) {
    const dataSource: ListDataSource<APIResource> = listConfig.getDataSource();
  }
  ngOnInit() {
  }
}
