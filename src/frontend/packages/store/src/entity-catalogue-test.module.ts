import { Inject, NgModule } from '@angular/core';
import { ReducerManager, Store } from '@ngrx/store';

import {
  requestDataReducerFactory,
} from './reducers/api-request-data-reducer/request-data-reducer.factory';
import { chainApiReducers, requestActions } from './reducers/api-request-reducers.generator.helpers';
import { InitCatalogueEntitiesAction } from './entity-catalogue.actions';
import { StratosBaseCatalogueEntity } from './entity-catalog/entity-catalogue-entity';
import { entityCatalogue, TestEntityCatalogue } from './entity-catalog/entity-catalogue.service';

export const TEST_CATALOGUE_ENTITIES = '__TEST_CATALOGUE_ENTITIES__';

@NgModule()
export class EntityCatalogueTestModule {
  constructor(
    store: Store<any>,
    reducerManager: ReducerManager,
    @Inject(TEST_CATALOGUE_ENTITIES) entityGroups: StratosBaseCatalogueEntity[],
  ) {
    baseEntityCatalogueSetup(store, reducerManager, entityGroups);
  }
}

/**
 * To be used in conjunction with `createBasicStoreModule` and `createEntityStoreState`
 */
@NgModule()
export class EntityCatalogueTestModuleManualStore {
  constructor(
    reducerManager: ReducerManager,
    @Inject(TEST_CATALOGUE_ENTITIES) entityGroups: StratosBaseCatalogueEntity[],
  ) {
    baseEntityCatalogueSetup(null, reducerManager, entityGroups);
  }
}

function baseEntityCatalogueSetup(
  store: Store<any>,
  reducerManager: ReducerManager,
  entityGroups: StratosBaseCatalogueEntity[]
) {
  const testEntityCatalogue = entityCatalogue as TestEntityCatalogue;
  testEntityCatalogue.clear();

  const entities = [].concat.apply([], entityGroups) as StratosBaseCatalogueEntity[];
  entities.forEach(entity => entityCatalogue.register(entity));

  const dataReducer = requestDataReducerFactory(requestActions);
  const extraReducers = entityCatalogue.getAllEntityRequestDataReducers();
  const chainedReducers = chainApiReducers(dataReducer, extraReducers);
  reducerManager.removeReducer('requestData');
  reducerManager.addReducer('requestData', chainedReducers);

  if (store) {
    store.dispatch(new InitCatalogueEntitiesAction(entities));
  }
}
