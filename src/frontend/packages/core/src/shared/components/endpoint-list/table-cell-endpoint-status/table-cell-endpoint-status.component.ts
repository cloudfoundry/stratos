import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';

import { EndpointModel, EndpointsDataService, endpointConnectionStatus, entityCatalog, withConnectingOverlay } from '@stratosui/store';

import { TableCellCustom } from '../../signal-list/cell-base';
import { CustomIconComponent } from '../../../../shared/components/custom-material/custom-material.component';
import { AppBusyComponent } from '../../busy-indicator/busy-indicator.component';

@Component({
  selector: 'app-table-cell-endpoint-status',
  templateUrl: './table-cell-endpoint-status.component.html',
  standalone: true,
  imports: [
    CustomIconComponent,
    AppBusyComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableCellEndpointStatusComponent extends TableCellCustom<EndpointModel, { showLabel: boolean; }> implements OnInit {

  public connectable = true;
  private endpointsData = inject(EndpointsDataService);

  @Input()
  get row(): EndpointModel {
    return super.row;
  }
  set row(row: EndpointModel) {
    super.row = row;
  }

  // Displayed status = the wire-derived connectionStatus overlaid with the
  // transient 'connecting' / 'disconnecting' while the operation is in
  // flight. Reading isConnecting()/isDisconnecting() here tracks the state
  // signals, so the zoneless OnPush template re-renders when the operation
  // starts and finishes.
  get status(): endpointConnectionStatus {
    return withConnectingOverlay(
      this.row?.connectionStatus,
      this.endpointsData.isConnecting(this.row?.guid ?? ''),
      this.endpointsData.isDisconnecting(this.row?.guid ?? ''),
    );
  }

  constructor() {
    super();
    this.config = {
      showLabel: true,
    };
  }

  ngOnInit() {
    const ep = this.row.cnsi_type ? entityCatalog.getEndpoint(this.row.cnsi_type, this.row.sub_type) : null;
    if (ep) {
      this.connectable = !ep.definition.unConnectable;
    }
  }
}
