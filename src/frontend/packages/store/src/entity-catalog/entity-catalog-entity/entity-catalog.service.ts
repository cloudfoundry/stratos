import { inject, Inject, Injectable } from '@angular/core';
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
  public esf = inject(ENTITY_SERVICE_FACTORY_TOKEN) as EntityServiceFactory;
  public pmf = inject(PAGINATION_MONITOR_FACTORY_TOKEN) as PaginationMonitorFactory;
  public store = inject(Store<AppState>);
}
