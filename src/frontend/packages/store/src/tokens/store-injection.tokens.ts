import { InjectionToken } from '@angular/core';
import type { IEntityCatalog } from '../entity-catalog/entity-catalog.interface';
import type { EntityServiceFactory } from '../entity-service-factory.service';
import type { PaginationMonitorFactory } from '../monitors/pagination-monitor.factory';

/**
 * Shared injection tokens for the store module to break circular dependencies.
 * These tokens are used to inject services via Angular DI instead of direct imports.
 */

export const ENTITY_CATALOG_TOKEN = new InjectionToken<IEntityCatalog>('EntityCatalog');
export const ENTITY_SERVICE_FACTORY_TOKEN = new InjectionToken<EntityServiceFactory>('EntityServiceFactory');
export const PAGINATION_MONITOR_FACTORY_TOKEN = new InjectionToken<PaginationMonitorFactory>('PaginationMonitorFactory');