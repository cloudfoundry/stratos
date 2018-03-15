import { Store } from '@ngrx/store';
import { schema } from 'normalizr';
import { map } from 'rxjs/operators';

import { GetAppStatsAction } from '../../../../../store/actions/app-metadata.actions';
import { getPaginationKey } from '../../../../../store/actions/pagination.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { AppStat } from '../../../../../store/types/app-metadata.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { entityFactory } from '../../../../../store/helpers/entity-factory';
import { appStatsSchemaKey } from '../../../../../store/helpers/entity-factory';

export interface ListAppInstanceUsage {
  mem: number;
  disk: number;
  cpu: number;
  hasStats: boolean;
}

export interface ListAppInstance {
  index: number;
  value: AppStat;
  usage: ListAppInstanceUsage;
}

export class CfAppInstancesDataSource extends ListDataSource<ListAppInstance, APIResource<AppStat>> {

  constructor(
    store: Store<AppState>,
    _cfGuid: string,
    _appGuid: string,
    listConfig: IListConfig<ListAppInstance>
  ) {
    const paginationKey = getPaginationKey(appStatsSchemaKey, _cfGuid, _appGuid);
    const action = new GetAppStatsAction(_appGuid, _cfGuid);

    super(
      {
        store,
        action,
        schema: entityFactory(appStatsSchemaKey),
        getRowUniqueId: (row: ListAppInstance) => row.index.toString(),
        paginationKey,
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
