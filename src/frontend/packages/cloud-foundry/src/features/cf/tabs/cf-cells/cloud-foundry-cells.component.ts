import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Store } from '@ngrx/store';
import type { Observable } from 'rxjs';

import { ListComponent, ListConfig } from '@stratosui/core';
import { GeneralEntityAppState,  PaginationMonitorFactory } from '@stratosui/store';

import { CfCellsListConfigService } from '../../../../shared/components/list/list-types/cf-cells/cf-cells-list-config.service';
import { CfCellHelper } from '../../cf-cell.helpers';
import { getActiveRouteCfCellProvider } from '../../cf.helpers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cloud-foundry-cells',
  templateUrl: './cloud-foundry-cells.component.html',
  styleUrls: ['./cloud-foundry-cells.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    ListComponent,
  ],
  providers: [
    {
      provide: ListConfig,
      useClass: CfCellsListConfigService,
    },
    getActiveRouteCfCellProvider,
  ],
})
export class CloudFoundryCellsComponent {
  hasCellMetrics$: Observable<boolean>;

  constructor(
    cfEndpointService: CloudFoundryEndpointService,
    store: Store<GeneralEntityAppState>,
    paginationMonitorFactory: PaginationMonitorFactory
  ) {
    const cellHelper = new CfCellHelper(store, paginationMonitorFactory);
    this.hasCellMetrics$ = cellHelper.hasCellMetrics(cfEndpointService.cfGuid);
  }
}
