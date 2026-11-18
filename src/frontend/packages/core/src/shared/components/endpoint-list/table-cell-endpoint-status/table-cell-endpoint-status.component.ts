import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';

import {
  EndpointLastErrorService,
  EndpointModel,
  EndpointsDataService,
  describeLastConnectError,
  endpointConnectionStatus,
  entityCatalog,
  withConnectingOverlay,
} from '@stratosui/store';

import { TableCellCustom } from '../../signal-list/cell-base';
import { CustomIconComponent } from '../../../../shared/components/custom-material/custom-material.component';
import { AppBusyComponent } from '../../busy-indicator/busy-indicator.component';
import { NO_SYNC_STATUS, endpointSyncStatusLabel } from '../endpoint-sync-status';

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
  private lastErrors = inject(EndpointLastErrorService);

  // The label shows unless a host binds [config] with showLabel false.
  readonly showLabel = computed(() => this.config()?.showLabel ?? true);

  // Displayed status = the wire-derived connectionStatus overlaid with the
  // transient 'connecting' / 'disconnecting' while the operation is in
  // flight. Reading isConnecting()/isDisconnecting() here tracks the state
  // signals, so the zoneless OnPush template re-renders when the operation
  // starts and finishes.
  get status(): endpointConnectionStatus {
    return withConnectingOverlay(
      this.row()?.connectionStatus,
      this.endpointsData.isConnecting(this.row()?.guid ?? ''),
      this.endpointsData.isDisconnecting(this.row()?.guid ?? ''),
    );
  }

  // Sync status of a type that needs no login (shared with the endpoints list).
  readonly noSyncStatus = NO_SYNC_STATUS;

  get syncLabel(): string | null {
    return endpointSyncStatusLabel(this.row());
  }

  // Why the last connect failed, for an endpoint left Disconnected or
  // Expired by it (a failed connect stores no token).
  get lastError(): string | null {
    const status = this.status;
    const message = status === 'disconnected' || status === 'expired' ? this.lastErrors.lastError(this.row()?.guid ?? '') : null;
    return message ? describeLastConnectError(message) : null;
  }

  ngOnInit() {
    const row = this.row();
    const ep = row.cnsi_type ? entityCatalog.getEndpoint(row.cnsi_type, row.sub_type) : null;
    if (ep) {
      this.connectable = !ep.definition.unConnectable;
    }
  }
}
