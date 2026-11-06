import { Injectable } from '@angular/core';

/**
 * Marker injectable retained so the entity-catalog can hold a root-injected
 * helper instance (see `EntityCatalogHelpers.SetEntityCatalogHelper`). The
 * former ngrx `EntityServiceFactory` / `PaginationMonitorFactory` /
 * `getPaginationObservables` members were removed with the request/pagination
 * store engine; nothing reads them any more.
 */
@Injectable({
  providedIn: 'root'
})
export class EntityCatalogHelper { }
