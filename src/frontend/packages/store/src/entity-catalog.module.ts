import { ModuleWithProviders, NgModule, inject } from '@angular/core';
import { ReducerManager, Store } from '@ngrx/store';

import { InitCatalogEntitiesAction } from './entity-catalog.actions';
import { entityCatalog } from './entity-catalog/entity-catalog';
import { StratosBaseCatalogEntity } from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { requestDataReducerFactory } from './reducers/api-request-data-reducer/request-data-reducer.factory';
import { chainApiReducers, requestActions } from './reducers/api-request-reducers.generator.helpers';

// FIXME: Needs spelling update
export const CATALOGUE_ENTITIES = '__CATALOGUE_ENTITIES__';

/**
 * EntityCatalogFeatureModule - Handles entity catalog registration during module initialization
 *
 * IMPORTANT: Entity registration is SYNCHRONOUS and happens during module construction.
 * Angular's module lifecycle guarantees this constructor completes before any component
 * constructors run, eliminating race conditions in entity access.
 *
 * Registration Flow:
 * 1. Angular processes module imports (in order defined in app.module.ts)
 * 2. This constructor executes synchronously for each EntityCatalogModule.forFeature() call
 * 3. Entities are registered to the global entityCatalog singleton via Map.set() (synchronous)
 * 4. Dynamic reducers are added to NgRx ReducerManager
 * 5. InitCatalogEntitiesAction dispatched to store
 * 6. ONLY THEN do component constructors begin execution
 *
 * This ensures entities are always available when components need them.
 */
@NgModule({})
export class EntityCatalogFeatureModule {
  constructor() {
    const store = inject<Store<any>>(Store);
    const reducerManager = inject(ReducerManager);
    const entityGroups = inject<StratosBaseCatalogEntity[][]>(CATALOGUE_ENTITIES as any);

    // Flatten multi-provider arrays and register all entities synchronously
    const entities = entityGroups.flat();

    // Register all entities with the global catalog (synchronous Map.set operations)
    entities.forEach(entity => entityCatalog.register(entity));

    // NOTE: Validation has been moved to AppModule constructor to run once after ALL feature modules load.
    // This eliminates false-positive warnings from validation running in the first EntityCatalogFeatureModule
    // instance before subsequent instances (CF, K8s) complete their registrations.

    // Add dynamic reducers for entity request data
    const dataReducer = requestDataReducerFactory(requestActions);
    const extraReducers = entityCatalog.getAllEntityRequestDataReducers();
    const chainedReducers = chainApiReducers(dataReducer, extraReducers);
    reducerManager.addReducer('requestData', chainedReducers);

    // Notify store that entities are registered
    store.dispatch(new InitCatalogEntitiesAction(entities));
  }
}

@NgModule({})
export class EntityCatalogModule {
  // TODO: this does not allow for lazy loading, work out if we can allow this.
  // https://github.com/cloudfoundry-incubator/stratos/issues/3741
  static forFeature(entityFactory: () => StratosBaseCatalogEntity[]): ModuleWithProviders<EntityCatalogFeatureModule> {
    // Note - If you place any code here before `return` you get funky errors.
    return {
      ngModule: EntityCatalogFeatureModule,
      providers: [
        ReducerManager,
        Store,
        { provide: CATALOGUE_ENTITIES, useFactory: entityFactory, multi: true }
      ]
    };
  }
}
