import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { ListAppInstance, ListAppInstanceUsage } from './app-instance-types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { AppStat } from '../../../../../../../store/src/types/app-metadata.types';
import { AppState } from '../../../../../../../store/src/app-state';
import { createEntityRelationPaginationKey } from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { applicationSchemaKey, entityFactory, appStatsSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import { GetAppStatsAction } from '../../../../../../../store/src/actions/app-metadata.actions';

export class CfAppInstancesDataSource extends ListDataSource<ListAppInstance, APIResource<AppStat>> {

  constructor(
    store: Store<AppState>,
    _cfGuid: string,
    _appGuid: string,
    listConfig: IListConfig<ListAppInstance>
  ) {
    const paginationKey = createEntityRelationPaginationKey(applicationSchemaKey, _appGuid);
    const action = new GetAppStatsAction(_appGuid, _cfGuid);

    super(
      {
        store,
        action,
        schema: entityFactory(appStatsSchemaKey),
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
              usage: this.calcUsage(instances[key].entity),
              value: instances[key].entity
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
