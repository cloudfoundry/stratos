import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import {
  CfServicesListConfigService,
} from '../../../shared/components/list/list-types/cf-services/cf-services-list-config.service';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf/cf.helpers';

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
export class ServiceCatalogPageComponent {

  public cfIds$: Observable<string[]>;

  constructor(public cloudFoundryService: CloudFoundryService) {
    this.cfIds$ = cloudFoundryService.cFEndpoints$.pipe(
      map(endpoints => endpoints
        .filter(endpoint => endpoint.connectionStatus === 'connected')
        .map(endpoint => endpoint.guid)
      )
    );
  }
}
