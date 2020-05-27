import { Inject, ModuleWithProviders, NgModule } from '@angular/core';
import { ReducerManager, Store } from '@ngrx/store';

import { InitCatalogEntitiesAction } from './entity-catalog.actions';
import { entityCatalog } from './entity-catalog/entity-catalog';
import { StratosBaseCatalogEntity } from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { requestDataReducerFactory } from './reducers/api-request-data-reducer/request-data-reducer.factory';
import { chainApiReducers, requestActions } from './reducers/api-request-reducers.generator.helpers';

// FIXME: Needs spelling update
export const CATALOGUE_ENTITIES = '__CATALOGUE_ENTITIES__';

@NgModule({})
export class EntityCatalogFeatureModule {
  constructor(
    store: Store<any>,
    reducerManager: ReducerManager,
    @Inject(CATALOGUE_ENTITIES) entityGroups: StratosBaseCatalogEntity[][],
  ) {
    const entities = [].concat.apply([], entityGroups) as StratosBaseCatalogEntity[];
    entities.forEach(entity => entityCatalog.register(entity));
    const dataReducer = requestDataReducerFactory(requestActions);
    const extraReducers = entityCatalog.getAllEntityRequestDataReducers();
    const chainedReducers = chainApiReducers(dataReducer, extraReducers);
    reducerManager.addReducer('requestData', chainedReducers);
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
