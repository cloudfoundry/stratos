import { InjectionToken } from '@angular/core';
import type { IEntityCatalog } from '../entity-catalog/entity-catalog.interface';

/**
 * Shared injection tokens for the store module to break circular dependencies.
 * These tokens are used to inject services via Angular DI instead of direct imports.
 */

export const ENTITY_CATALOG_TOKEN = new InjectionToken<IEntityCatalog>('EntityCatalog');