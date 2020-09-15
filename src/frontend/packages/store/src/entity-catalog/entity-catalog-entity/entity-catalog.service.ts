import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../app-state';
import { EntityServiceFactory } from '../../entity-service-factory.service';
import { PaginationMonitorFactory } from '../../monitors/pagination-monitor.factory';
import { getPaginationObservables } from '../../reducers/pagination-reducer/pagination-reducer.helper';

@Injectable()
export class EntityCatalogHelper {

  // Remove cyclic dependency by accessing this here instead of in entity catalog entity
  public getPaginationObservables = getPaginationObservables;

  constructor(
    public esf: EntityServiceFactory,
    public pmf: PaginationMonitorFactory,
    public store: Store<AppState>,
  ) {

  }
}
