import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { ListDataSource, IListConfig } from '@stratosui/core';
import { AppStat, AppStats } from '../../../../../store/types/app-metadata.types';
import { CFAppState } from '../../../../../cf-app-state';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { applicationEntityType, appStatsEntityType } from '../../../../../cf-entity-types';
import { createEntityRelationPaginationKey } from '../../../../../entity-relations/entity-relations.types';
import { ListAppInstance, ListAppInstanceUsage } from './app-instance-types';

export class CfAppInstancesDataSource extends ListDataSource<ListAppInstance, AppStats> {

  constructor(
    store: Store<CFAppState>,
    cfGuid: string,
    appGuid: string,
    listConfig: IListConfig<ListAppInstance>
  ) {
    const paginationKey = createEntityRelationPaginationKey(applicationEntityType, appGuid);
    const action = cfEntityCatalog.appStats.actions.getMultiple(appGuid, cfGuid);

    super(
      {
        store,
        action,
        schema: cfEntityFactory(appStatsEntityType),
        getRowUniqueId: (row: AppStats) => {
          // At runtime this is called with ListAppInstance (post-transform) for trackBy/selection.
          // Fall back to guid parsing when called with a raw AppStat from the store.
          const index = (row as any).index;
          if (index !== undefined) {
            return String(index);
          }
          const guid: string = (row as any).guid || '';
          return guid.split('-').pop() || 'unknown';
        },
        paginationKey,
        transformEntities: [{ type: 'filter', field: 'value.state' }],
        transformEntity: map((stats: AppStats[]): ListAppInstance[] => {
          // At runtime each element is an AppStat (store normalizes AppStats → individual AppStat entries)
          const instances = stats as unknown as AppStat[];
          if (!instances?.length) {
            return [];
          }
          // Each AppStat has guid = "{appGuid}-{instanceIndex}"; parse the index from the tail.
          // The Map deduplicates if the same index appears twice, preferring entries with full stats.
          const byIndex = new Map<number, ListAppInstance>();
          for (const stat of instances) {
            const index = parseInt(stat.guid?.split('-').pop() ?? '', 10);
            if (!isNaN(index)) {
              const entry = { index, usage: this.calcUsage(stat), value: stat };
              if (!byIndex.has(index) || entry.usage.hasStats) {
                byIndex.set(index, entry);
              }
            }
          }
          return Array.from(byIndex.values());
        }),
        isLocal: true,
        listConfig
      }
    );

  }

  // Need to calculate usage as a fraction for sorting
  calcUsage(instanceStats: AppStat): ListAppInstanceUsage {
    const usage: ListAppInstanceUsage = {
      mem: 0,
      disk: 0,
      cpu: 0,
      hasStats: false
    };

    if (instanceStats.stats && instanceStats.stats.usage) {
      usage.mem = instanceStats.stats.usage.mem / instanceStats.stats.mem_quota;
      usage.disk = instanceStats.stats.usage.disk / instanceStats.stats.disk_quota;
      usage.cpu = instanceStats.stats.usage.cpu;
      usage.hasStats = true;
    }
    return usage;
  }

}
