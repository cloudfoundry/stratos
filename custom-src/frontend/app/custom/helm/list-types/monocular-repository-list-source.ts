import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';

import { GetAllEndpoints } from '../../../../../store/src/actions/endpoint.actions';
import { AppState } from '../../../../../store/src/app-state';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { RowState } from '../../../shared/components/list/data-sources-controllers/list-data-source-types';
import {
  BaseEndpointsDataSource,
  syncPaginationSection,
} from '../../../shared/components/list/list-types/endpoint/base-endpoints-data-source';
import { IListConfig } from '../../../shared/components/list/list.component.types';
import { EntityMonitorFactory } from '../../../shared/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../shared/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';

export class MonocularRepositoryDataSource extends BaseEndpointsDataSource {

  private highlighted;
  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<EndpointModel>,
    highlighted: string,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory,
  ) {
    const action = new GetAllEndpoints();
    const paginationKey = 'mono-endpoints';
    // We do this here to ensure we sync up with main endpoint table data.
    syncPaginationSection(store, action, paginationKey);
    action.paginationKey = paginationKey;
    super(
      store,
      listConfig,
      action,
      'helm',
      paginationMonitorFactory,
      entityMonitorFactory,
      internalEventMonitorFactory,
      false);
    this.highlighted = highlighted;
    this.getRowState = (row: any): Observable<RowState> => observableOf({ highlighted: row.guid === this.highlighted });
  }

}
