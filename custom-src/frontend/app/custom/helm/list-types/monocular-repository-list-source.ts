import { HostBinding } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/src/app-state';
import { IListConfig } from '../../../shared/components/list/list.component.types';
import { BaseEndpointsDataSource } from '../../../shared/components/list/list-types/cf-endpoints/base-endpoints-data-source';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { RowState } from '../../../shared/components/list/data-sources-controllers/list-data-source-types';
import { Observable, of as observableOf } from 'rxjs';

export class MonocularRepositoryDataSource extends BaseEndpointsDataSource {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<EndpointModel>,
    endpointType: string,
    public highlighted: string,
  ) {
    //super(store, listConfig, endpointType, null);
    super(store, listConfig, endpointType);
  }

  getRowState = function(row: any): Observable<RowState> {
    return observableOf(
      {
          highlighted: row.guid === this.highlighted
      });
  };

}
