import { Inject, NgModule } from '@angular/core';
import { ReducerManager, Store } from '@ngrx/store';

import { InitCatalogEntitiesAction } from './entity-catalog.actions';
import { entityCatalog, TestEntityCatalog } from './entity-catalog/entity-catalog';
import { StratosBaseCatalogEntity } from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { requestDataReducerFactory } from './reducers/api-request-data-reducer/request-data-reducer.factory';
import { chainApiReducers, requestActions } from './reducers/api-request-reducers.generator.helpers';

export const TEST_CATALOGUE_ENTITIES = '__TEST_CATALOGUE_ENTITIES__';

@NgModule()
export class EntityCatalogTestModule {
  constructor(
    store: Store<any>,
    reducerManager: ReducerManager,
    @Inject(TEST_CATALOGUE_ENTITIES) entityGroups: StratosBaseCatalogEntity[],
  ) {
    baseEntityCatalogSetup(store, reducerManager, entityGroups);
  }
}

/**
 * To be used in conjunction with `createBasicStoreModule` and `createEntityStoreState`
 */
@NgModule()
export class EntityCatalogTestModuleManualStore {
  constructor(
    reducerManager: ReducerManager,
    @Inject(TEST_CATALOGUE_ENTITIES) entityGroups: StratosBaseCatalogEntity[],
  ) {
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

  const entities = [].concat.apply([], entityGroups) as StratosBaseCatalogEntity[];
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
