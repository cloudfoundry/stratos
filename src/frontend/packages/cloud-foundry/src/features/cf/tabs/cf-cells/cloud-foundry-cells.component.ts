import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { ListComponent, ListConfig } from '@stratosui/core';
import { AppState, PaginationMonitorFactory } from '@stratosui/store';

import { CfCellsListConfigService } from '../../../../shared/components/list/list-types/cf-cells/cf-cells-list-config.service';
import { CfCellHelper } from '../../cf-cell.helpers';
import { getActiveRouteCfCellProvider } from '../../cf.helpers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';


@Component({
  selector: 'app-cloud-foundry-cells',
  templateUrl: './cloud-foundry-cells.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ListComponent,
  ],
  providers: [
    {
      provide: ListConfig,
      useClass: CfCellsListConfigService
    },
    getActiveRouteCfCellProvider,
  ],
})
export class CloudFoundryCellsComponent {
  hasCellMetrics$: Observable<boolean>;

  constructor() {
    const cfEndpointService = inject(CloudFoundryEndpointService);
    const store = inject<Store<AppState>>(Store);
    const paginationMonitorFactory = inject(PaginationMonitorFactory);

    const cellHelper = new CfCellHelper(store, paginationMonitorFactory);
    this.hasCellMetrics$ = cellHelper.hasCellMetrics(cfEndpointService.cfGuid);
  }
}
