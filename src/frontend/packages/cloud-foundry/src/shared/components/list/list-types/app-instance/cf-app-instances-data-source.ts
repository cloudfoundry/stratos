import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { AppStat, AppStats } from '../../../../../../../cloud-foundry/src/store/types/app-metadata.types';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
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
        transformEntity: map((instancesObj: AppStats[]): ListAppInstance[] => {
          if (!instancesObj || instancesObj.length === 0) {
            return [];
          }
          const res: ListAppInstance[] = [];
          // AppStats is an object where each key is an instance ID
          const instances = instancesObj[0];
          Object.keys(instances || {}).forEach((key: string) => {
            const instance: AppStat = instances[key];
            res.push({
              index: parseInt(instance.guid, 10),
              usage: this.calcUsage(instance),
              value: instance
            });
          });
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
