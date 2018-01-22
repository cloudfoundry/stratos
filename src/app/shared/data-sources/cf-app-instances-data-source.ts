import { EntityInfo } from '../../store/types/api.types';
import { EventSchema, GetAllAppEvents } from '../../store/actions/app-event.actions';
import { GetAppInstancesAction, InstanceSchema } from './../../store/actions/app-metadata.actions';
import { AppState } from '../../store/app-state';
import { Subscription } from 'rxjs/Rx';
import { DataSource } from '@angular/cdk/table';
import { Store } from '@ngrx/store';
import { MatPaginator, PageEvent, MatSort, Sort, SortDirection } from '@angular/material';

import { map } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { schema } from 'normalizr';
import { ListDataSource } from './list-data-source';
import { PaginationEntityState, QParam } from '../../store/types/pagination.types';
import { AddParams, RemoveParams } from '../../store/actions/pagination.actions';
import { ListFilter, SetListStateAction, ListPagination } from '../../store/actions/list.actions';
import { inspect } from 'util';

export class CfAppInstancesDataSource extends ListDataSource<any> {

  constructor(
    _store: Store<AppState>,
    _cfGuid: string,
    _appGuid: string,
  ) {
    const paginationKey = `app-instances:${_cfGuid}${_appGuid}`;
    const action =         new GetAppInstancesAction(_appGuid, _cfGuid);

    super(
      _store,
      action,
      InstanceSchema,
      (object: any) => {
        // Unique identifier for each row - used for multi-select actions
        return object.index;
      },
      () => ({} as any),
      paginationKey,
      map(instances => {
        return Object.keys(instances[0]).map(index => ({
          index,
          usage: this.calcUsage(instances[0][index]),
          value: instances[0][index]
        }));
      }),
      true,
      [
        {
          type: 'sort',
          orderKey: 'index',
          field: 'index',
        },
        {
          type: 'sort',
          orderKey: 'state',
          field: 'value.state'
        },
        {
          type: 'sort',
          orderKey: 'memory',
          field: 'usage.mem'
        },
        {
          type: 'sort',
          orderKey: 'disk',
          field: 'usage.disk'
        },
        {
          type: 'sort',
          orderKey: 'cpu',
          field: 'usage.cpu'
        },
        {
          type: 'sort',
          orderKey: 'uptime',
          field: 'value.stats.uptime'
        }
      ]

    );

    _store.dispatch(new SetListStateAction(
      paginationKey,
      'table',
    ));
  }

  // Need to calculate usage as a fraction for sorting
  calcUsage(instanceStats) {
    const usage = {
      mem: 0,
      disk: 0,
      cpu: 0,
      hasStats: false
    };

    if (instanceStats.stats && instanceStats.stats.usage ) {
      usage.mem = instanceStats.stats.usage.mem / instanceStats.stats.mem_quota;
      usage.disk = instanceStats.stats.usage.disk / instanceStats.stats.disk_quota;
      usage.cpu = instanceStats.stats.usage.cpu;
      usage.hasStats = true;
    }
    return usage;
  }
}
