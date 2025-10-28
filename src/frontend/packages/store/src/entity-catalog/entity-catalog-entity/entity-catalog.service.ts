import { Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../app-state';
import type { EntityServiceFactory } from '../../entity-service-factory.service';
import type { PaginationMonitorFactory } from '../../monitors/pagination-monitor.factory';
import { getPaginationObservables } from '../../reducers/pagination-reducer/pagination-reducer.helper';
import { ENTITY_SERVICE_FACTORY_TOKEN, PAGINATION_MONITOR_FACTORY_TOKEN } from '../../tokens/store-injection.tokens';

@Injectable({
  providedIn: 'root'
})
export class EntityCatalogHelper {

  // Remove cyclic dependency by accessing this here instead of in entity catalog entity
  public getPaginationObservables = getPaginationObservables;

  constructor(
    @Inject(ENTITY_SERVICE_FACTORY_TOKEN) public esf: EntityServiceFactory,
    @Inject(PAGINATION_MONITOR_FACTORY_TOKEN) public pmf: PaginationMonitorFactory,
    public store: Store<AppState>,
  ) {

  }
}
