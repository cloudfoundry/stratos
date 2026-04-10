import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ListComponent, ListConfig, PageHeaderComponent } from '@stratosui/core';
import { CfEndpointsMissingComponent } from '../../../shared/components/cf-endpoints-missing/cf-endpoints-missing.component';
import {
  CfServicesListConfigService,
} from '../../../shared/components/list/list-types/cf-services/cf-services-list-config.service';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf/cf.helpers';

@Component({
  selector: 'app-service-catalog-page',
  templateUrl: './service-catalog-page.component.html',
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    {
      provide: ListConfig,
      useClass: CfServicesListConfigService
    }
  ],
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    CfEndpointsMissingComponent,
    ListComponent
  ]
})
export class ServiceCatalogPageComponent {

  public cfIds$: Observable<string[]>;

  public cloudFoundryService = inject(CloudFoundryService);

  constructor() {
    this.cfIds$ = this.cloudFoundryService.cFEndpoints$.pipe(
      map(endpoints => endpoints
        .filter(endpoint => endpoint.connectionStatus === 'connected')
        .map(endpoint => endpoint.guid)
      )
    );
  }
}
