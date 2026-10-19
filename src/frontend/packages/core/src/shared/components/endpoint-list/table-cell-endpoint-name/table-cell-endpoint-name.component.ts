import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { CustomTooltipDirective } from '../../custom-tooltip/custom-tooltip.directive';
import { RouterModule } from '@angular/router';
import { entityCatalog, EndpointModel, EndpointsDataService } from '@stratosui/store';

import { EndpointsService } from '../../../../core/endpoints.service';
import { TableCellCustom } from '../../signal-list/cell-base';
import { CustomIconComponent } from '../../../../shared/components/custom-material/custom-material.component';

export interface RowWithEndpointId {
  endpointId: string;
}

@Component({
  selector: 'app-table-cell-endpoint-name',
  templateUrl: './table-cell-endpoint-name.component.html',
  standalone: true,
  imports: [
    RouterModule,
    CustomIconComponent,
    CustomTooltipDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableCellEndpointNameComponent extends TableCellCustom<EndpointModel | RowWithEndpointId>  {

  private endpointsData = inject(EndpointsDataService);
  private endpointId = signal<string | undefined>(undefined);

  // Built once and keyed on the row's id, so a new row swaps the id instead
  // of adding another endpoint watcher that lives until the cell is destroyed.
  public readonly endpoint = computed(() => {
    const id = this.endpointId();
    const data = id ? this.endpointsData.endpoints().get(id) : undefined;
    if (!data) {
      return undefined;
    }
    const ep = data.cnsi_type ? entityCatalog.getEndpoint(data.cnsi_type, data.sub_type)?.definition : undefined;
    return {
      ...data,
      canShowLink: data.connectionStatus === 'connected' || !!ep?.unConnectable,
      link: EndpointsService.getLinkForEndpoint(data)
    };
  });

  @Input()
  set row(row: EndpointModel | RowWithEndpointId) {
    super.row = row;
    /* tslint:disable-next-line:no-string-literal */
    this.endpointId.set((row as any)['endpointId'] || (row as any)['guid']);
  }
}
