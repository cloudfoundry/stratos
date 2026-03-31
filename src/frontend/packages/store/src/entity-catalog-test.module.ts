import { NgModule, inject } from '@angular/core';
import { ReducerManager, Store } from '@ngrx/store';

import { InitCatalogEntitiesAction } from './entity-catalog.actions';
import { entityCatalog, TestEntityCatalog } from './entity-catalog/entity-catalog';
import { StratosBaseCatalogEntity } from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { requestDataReducerFactory } from './reducers/api-request-data-reducer/request-data-reducer.factory';
import { chainApiReducers, requestActions } from './reducers/api-request-reducers.generator.helpers';
import { ENTITY_CATALOG_TOKEN } from './tokens/store-injection.tokens';

export const TEST_CATALOGUE_ENTITIES = '__TEST_CATALOGUE_ENTITIES__';

@NgModule({
  providers: [
    {
      provide: ENTITY_CATALOG_TOKEN,
      useValue: entityCatalog
    }
  ]
})
export class EntityCatalogTestModule {
  constructor() {
    const store = inject<Store<any>>(Store);
    const reducerManager = inject(ReducerManager);
    const entityGroups = inject<StratosBaseCatalogEntity[]>(TEST_CATALOGUE_ENTITIES as any);

    baseEntityCatalogSetup(store, reducerManager, entityGroups);
  }
}

/**
 * To be used in conjunction with `createBasicStoreModule` and `createEntityStoreState`
 */
@NgModule({
  providers: [
    {
      provide: ENTITY_CATALOG_TOKEN,
      useValue: entityCatalog
    }
  ]
})
export class EntityCatalogTestModuleManualStore {
  constructor() {
    const reducerManager = inject(ReducerManager);
    const entityGroups = inject<StratosBaseCatalogEntity[]>(TEST_CATALOGUE_ENTITIES as any);

    baseEntityCatalogSetup(null, reducerManager, entityGroups);
  }
}

function baseEntityCatalogSetup(
  store: Store<any>,
  reducerManager: ReducerManager,
  entityGroups: StratosBaseCatalogEntity[]
) {
  const testEntityCatalog = entityCatalog as TestEntityCatalog;
  testEntityCatalog.clear();

  const entities = ([] as StratosBaseCatalogEntity[]).concat(...entityGroups);
  entities.forEach(entity => entityCatalog.register(entity));

  const dataReducer = requestDataReducerFactory(requestActions);
  const extraReducers = entityCatalog.getAllEntityRequestDataReducers();
  const chainedReducers = chainApiReducers(dataReducer, extraReducers);
  reducerManager.removeReducer('requestData');
  reducerManager.addReducer('requestData', chainedReducers);

  if (store) {
    store.dispatch(new InitCatalogEntitiesAction(entities));
  }
}
