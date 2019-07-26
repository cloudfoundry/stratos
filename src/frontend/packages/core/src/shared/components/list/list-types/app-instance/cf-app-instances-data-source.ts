import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import {
  applicationEntityType,
  appStatsEntityType,
  cfEntityFactory,
} from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { GetAppStatsAction } from '../../../../../../../cloud-foundry/src/actions/app-metadata.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { ListAppInstance, ListAppInstanceUsage } from './app-instance-types';
import { AppStat } from '../../../../../../../cloud-foundry/src/store/types/app-metadata.types';

export class CfAppInstancesDataSource extends ListDataSource<ListAppInstance, AppStat> {

  constructor(
    store: Store<CFAppState>,
    cfGuid: string,
    appGuid: string,
    listConfig: IListConfig<ListAppInstance>
  ) {
    const paginationKey = createEntityRelationPaginationKey(applicationEntityType, appGuid);
    const action = new GetAppStatsAction(appGuid, cfGuid);

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
