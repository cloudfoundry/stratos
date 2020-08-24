import {
  EntityCatalogEntityConfig,
  EntityMonitorFactory,
  PaginationMonitor,
  PaginationMonitorFactory,
} from '@stratosui/store';
import { Subscription } from 'rxjs';

import { TableRowStateManager } from './list-table/table-row/table-row-state-manager';

export type ListRowStateSetUpManager = (
  paginationMonitor: PaginationMonitor<any>,
  entityMonitorFactory: EntityMonitorFactory,
  rowStateManager: TableRowStateManager
) => Subscription;

export class ListRowSateHelper<T extends { guid: string }> {
  public getRowStateManager(
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    paginationKey: string,
    entityConfig: EntityCatalogEntityConfig,
    setup: ListRowStateSetUpManager,
    isLocal: boolean
  ) {
    const rowStateManager = new TableRowStateManager();
    const paginationMonitor = paginationMonitorFactory.create<T>(
      paginationKey,
      entityConfig,
      isLocal
    );

    const sub = setup(
      paginationMonitor,
      entityMonitorFactory,
      rowStateManager
    );
    return {
      rowStateManager,
      sub
    };
  }

}
