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
          // AppStats is an object with keys as instance IDs
          const keys = Object.keys(row || {});
          return keys.length > 0 ? keys[0] : 'unknown';
        },
        paginationKey,
        transformEntities: [{ type: 'filter', field: 'value.state' }],
        transformEntity: map((instancesData: any): ListAppInstance[] => {
          if (!instancesData) {
            return [];
          }

          // Extract from array if needed
          let data = Array.isArray(instancesData) ? instancesData[0] : instancesData;

          if (!data || typeof data !== 'object') {
            return [];
          }

          // Check if this is a single AppStat instance or a collection (AppStats)
          // A single instance has 'state', 'stats', 'guid' properties
          // A collection has numeric string keys like "0", "1", "2"
          const isSingleInstance = 'state' in data && 'guid' in data;

          const res: ListAppInstance[] = [];

          if (isSingleInstance) {
            // Handle single AppStat instance - extract index from guid
            // guid format: "app-guid-instanceIndex" (e.g., "1c654b6c-f3bd-472e-ba23-7a0788cfa074-0")
            const instance = data as AppStat;
            const guidParts = instance.guid ? instance.guid.split('-') : [];
            const indexStr = guidParts.length > 0 ? guidParts[guidParts.length - 1] : '0';
            const indexNum = parseInt(indexStr, 10);

            if (!isNaN(indexNum)) {
              res.push({
                index: indexNum,
                usage: this.calcUsage(instance),
                value: instance
              });
            }
          } else {
            // Handle AppStats collection (object with numeric keys)
            const instances = data as AppStats;
            Object.keys(instances).forEach((key: string) => {
              const instance: AppStat = instances[key];
              if (instance && typeof instance === 'object') {
                const indexNum = parseInt(key, 10);
                if (!isNaN(indexNum)) {
                  res.push({
                    index: indexNum,
                    usage: this.calcUsage(instance),
                    value: instance
                  });
                }
              }
            });
          }

          return res;
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
