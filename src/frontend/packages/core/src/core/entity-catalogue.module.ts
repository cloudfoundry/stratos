import { Inject, ModuleWithProviders, NgModule } from '@angular/core';
import { ReducerManager, Store } from '@ngrx/store';

import {
  requestDataReducerFactory,
} from '../../../store/src/reducers/api-request-data-reducer/request-data-reducer.factory';
import { chainApiReducers, requestActions } from '../../../store/src/reducers/api-request-reducers.generator.helpers';
import { InitCatalogueEntitiesAction } from './entity-catalogue.actions';
import { StratosBaseCatalogueEntity } from './entity-catalogue/entity-catalogue-entity';
import { entityCatalogue } from './entity-catalogue/entity-catalogue.service';

export const CATALOGUE_ENTITIES = '__CATALOGUE_ENTITIES__';

@NgModule({})
export class EntityCatalogueFeatureModule {
  constructor(
    store: Store<any>,
    reducerManager: ReducerManager,
    @Inject(CATALOGUE_ENTITIES) entityGroups: StratosBaseCatalogueEntity[][],
  ) {
    const entities = [].concat.apply([], entityGroups) as StratosBaseCatalogueEntity[];
    entities.forEach(entity => entityCatalogue.register(entity));
    const dataReducer = requestDataReducerFactory(requestActions);
    const extraReducers = entityCatalogue.getAllEntityRequestDataReducers();
    const chainedReducers = chainApiReducers(dataReducer, extraReducers);
    reducerManager.addReducer('requestData', chainedReducers);
    store.dispatch(new InitCatalogueEntitiesAction(entities));
  }
}

@NgModule({})
export class EntityCatalogueModule {
  // TODO: this does not allow for lazy loading, work out if we can allow this.
  // https://github.com/cloudfoundry-incubator/stratos/issues/3741
  static forFeature(entityFactory: () => StratosBaseCatalogueEntity[]): ModuleWithProviders {
    return {
      ngModule: EntityCatalogueFeatureModule,
      providers: [
        ReducerManager,
        Store,
        { provide: CATALOGUE_ENTITIES, useFactory: entityFactory, multi: true }
      ]
    };
  }
}
