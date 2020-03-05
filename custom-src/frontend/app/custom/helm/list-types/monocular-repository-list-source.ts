import { NgZone } from '@angular/core';
import { Store } from '@ngrx/store';
import { interval, Observable, of as observableOf, Subscription } from 'rxjs';

import { GetAllEndpoints } from '../../../../../store/src/actions/endpoint.actions';
import { AppState } from '../../../../../store/src/app-state';
import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../../store/src/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { safeUnsubscribe } from '../../../core/utils.service';
import { RowState } from '../../../shared/components/list/data-sources-controllers/list-data-source-types';
import {
  BaseEndpointsDataSource,
  syncPaginationSection,
} from '../../../shared/components/list/list-types/endpoint/base-endpoints-data-source';
import { IListConfig } from '../../../shared/components/list/list.component.types';
import { HELM_ENDPOINT_TYPE } from '../helm-entity-factory';

export class MonocularRepositoryDataSource extends BaseEndpointsDataSource {

  private polls: Subscription[];
  private highlighted;
  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<EndpointModel>,
    highlighted: string,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory,
    ngZone: NgZone,
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
      HELM_ENDPOINT_TYPE,
      paginationMonitorFactory,
      entityMonitorFactory,
      internalEventMonitorFactory,
      false);
    this.highlighted = highlighted;
    this.getRowState = (row: any): Observable<RowState> => observableOf({ highlighted: row.guid === this.highlighted });
    this.polls = [];
    ngZone.runOutsideAngular(() => {
      this.polls.push(
        interval(10000).subscribe(() => {
          ngZone.run(() => {
            store.dispatch(action);
          });
        })
      );
    });
  }

  destroy() {
    safeUnsubscribe(...(this.polls || []));
  }

}
