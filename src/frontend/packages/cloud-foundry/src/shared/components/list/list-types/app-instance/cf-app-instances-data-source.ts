import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { AppStat } from '../../../../../../../cloud-foundry/src/store/types/app-metadata.types';
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

export class CfAppInstancesDataSource extends ListDataSource<ListAppInstance, AppStat> {

  constructor(
    store: Store<CFAppState>,
    cfGuid: string,
    appGuid: string,
    listConfig: IListConfig<ListAppInstance>
  ) {
    const paginationKey = createEntityRelationPaginationKey(applicationEntityType, appGuid);
    const action = cfEntityCatalog.appStats.actions.getMultiple(appGuid, cfGuid)

    super(
      {
        store,
        action,
        schema: cfEntityFactory(appStatsEntityType),
        getRowUniqueId: (row: ListAppInstance) => row.index.toString(),
        paginationKey,
        transformEntities: [{ type: 'filter', field: 'value.state' }],
        transformEntity: map(instances => {
          if (!instances || instances.length === 0) {
            return [];
          }
          const res = [];
          Object.keys(instances).forEach(key => {
            res.push({
              index: key,
              usage: this.calcUsage(instances[key]),
              value: instances[key]
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
  calcUsage(instanceStats): ListAppInstanceUsage {
    const usage = {
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
