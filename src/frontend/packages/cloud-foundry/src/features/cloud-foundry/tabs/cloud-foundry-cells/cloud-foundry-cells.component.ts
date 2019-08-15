import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import { EndpointsService } from '../../../../../../core/src/core/endpoints.service';
import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import {
  CfCellsListConfigService,
} from '../../../../shared/components/list/list-types/cf-cells/cf-cells-list-config.service';
import { getActiveRouteCfCellProvider } from '../../cf.helpers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cloud-foundry-cells',
  templateUrl: './cloud-foundry-cells.component.html',
  styleUrls: ['./cloud-foundry-cells.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfCellsListConfigService
    },
    getActiveRouteCfCellProvider,
  ]
})
export class CloudFoundryCellsComponent {
  hasCellMetrics$: Observable<boolean>;

  constructor(endpointService: EndpointsService, cfEndpointService: CloudFoundryEndpointService) {
    this.hasCellMetrics$ = endpointService.hasCellMetrics(cfEndpointService.cfGuid);
  }
}
