import { Inject, NgModule } from '@angular/core';
import { ReducerManager } from '@ngrx/store';

import {
  requestDataReducerFactory,
} from '../../../store/src/reducers/api-request-data-reducer/request-data-reducer.factory';
import { chainApiReducers, requestActions } from '../../../store/src/reducers/api-request-reducers.generator.helpers';
import { StratosBaseCatalogueEntity } from './entity-catalogue/entity-catalogue-entity';
import { entityCatalogue, TestEntityCatalogue } from './entity-catalogue/entity-catalogue.service';

export const TEST_CATALOGUE_ENTITIES = '__TEST_CATALOGUE_ENTITIES__';

@NgModule({})
export class EffectsFeatureTestModule {
  constructor(
    reducerManager: ReducerManager,
    @Inject(TEST_CATALOGUE_ENTITIES) entityGroups: StratosBaseCatalogueEntity[],
  ) {
    const testEntityCatalogue = entityCatalogue as TestEntityCatalogue;
    testEntityCatalogue.clear();

    const entities = [].concat.apply([], entityGroups) as StratosBaseCatalogueEntity[];
    entities.forEach(entity => entityCatalogue.register(entity));

    const dataReducer = requestDataReducerFactory(requestActions);
    const extraReducers = entityCatalogue.getAllEntityRequestDataReducers();
    const chainedReducers = chainApiReducers(dataReducer, extraReducers);
    reducerManager.addReducer('requestData', chainedReducers);
  }
}
