import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { entityFactory } from '../../../store/helpers/entity-factory';
import { CfOrgSpaceItem } from '../../data-services/cf-org-space-service.service';
import { EntityMonitorFactory } from '../../monitors/entity-monitor.factory.service';
import { PaginationMonitor } from '../../monitors/pagination-monitor';
import { PaginationMonitorFactory } from '../../monitors/pagination-monitor.factory';
import { TableRowStateManager } from './list-table/table-row/table-row-state-manager';

export function createListFilterConfig(key: string, label: string, cfOrgSpaceItem: CfOrgSpaceItem) {
  return {
    key: key,
    label: label,
    ...cfOrgSpaceItem,
    list$: cfOrgSpaceItem.list$.pipe(map((entities: any[]) => {
      return entities.map(entity => ({
        label: entity.name,
        item: entity,
        value: entity.guid
      }));
    })),
  };
}

export type ListRowStateSetUpManager = (
  paginationMonitor: PaginationMonitor<any>,
  entityMonitorFactory: EntityMonitorFactory,
  rowStateManager: TableRowStateManager,
  schemaKey: string) => Subscription;

export class ListRowSateHelper<T extends { guid: string }> {
  public getRowStateManager(
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    paginationKey: string,
    schemaKey: string,
    setup: ListRowStateSetUpManager
  ) {
    const rowStateManager = new TableRowStateManager();
    const paginationMonitor = paginationMonitorFactory.create<T>(
      paginationKey,
      entityFactory(schemaKey)
    );

    const sub = setup(
      paginationMonitor,
      entityMonitorFactory,
      rowStateManager,
      schemaKey
    );
    return {
      rowStateManager,
      sub
    };
  }

}
