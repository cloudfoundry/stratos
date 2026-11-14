import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { EndpointModel, EndpointsDataService, getFullEndpointApiUrl } from '@stratosui/store';

import { EndpointsSignalService } from '../../../../core/signals/endpoints-signal.service';
import { CopyToClipboardComponent } from '../../copy-to-clipboard/copy-to-clipboard.component';
import { CustomTooltipDirective } from '../../custom-tooltip/custom-tooltip.directive';
import { TableCellCustom } from '../../signal-list/cell-base';
import { RowWithEndpointId } from '../table-cell-endpoint-name/table-cell-endpoint-name.component';

@Component({
  selector: 'app-table-cell-endpoint-address',
  templateUrl: './table-cell-endpoint-address.component.html',
  standalone: true,
  imports: [
    CommonModule,
    CopyToClipboardComponent,
    CustomTooltipDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableCellEndpointAddressComponent extends TableCellCustom<EndpointModel | RowWithEndpointId>  {
  private endpointsSignal = inject(EndpointsSignalService);
  private endpointsData = inject(EndpointsDataService);
  private readonly endpointId = computed<string>(() => {
    const row = this.row() as any;
    return row['endpointId'] || row['guid'];
  });

  /** The row's address, once its endpoint is in the list. */
  public readonly endpointAddress = computed<string | null>(() => {
    const endpoint = this.endpointsData.endpoints().get(this.endpointId());
    return endpoint ? getFullEndpointApiUrl(endpoint) : null;
  });
  public readonly isDuplicate = computed(() => {
    const address = this.endpointAddress();
    return address !== null &&
      Object.values(this.endpointsSignal.endpoints()).filter(e => getFullEndpointApiUrl(e) === address).length > 1;
  });
}
