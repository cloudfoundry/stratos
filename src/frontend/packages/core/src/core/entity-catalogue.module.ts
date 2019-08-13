import { Inject, ModuleWithProviders, NgModule } from '@angular/core';
import { ReducerManager, Store } from '@ngrx/store';

import { endpointSchemaKey } from '../../../store/src/helpers/entity-factory';
import {
  requestDataReducerFactory,
} from '../../../store/src/reducers/api-request-data-reducer/request-data-reducer.factory';
import { chainApiReducers, requestActions } from '../../../store/src/reducers/api-request-reducers.generator.helpers';
import { STRATOS_ENDPOINT_TYPE } from '../base-entity-schemas';
import { InitCatalogueEntitiesAction } from './entity-catalogue.actions';
import { StratosBaseCatalogueEntity } from './entity-catalogue/entity-catalogue-entity';
import { EntityCatalogueHelpers } from './entity-catalogue/entity-catalogue.helper';
import { entityCatalogue } from './entity-catalogue/entity-catalogue.service';

export const CATALOGUE_ENTITIES = '__CATALOGUE_ENTITIES__';
// TODO: RC explain
export const SKIP_ENTITY_SECTION_INIT = '__SKIP_ENTITY_SECTION_INIT__';

@NgModule({})
export class EffectsFeatureModule {
  constructor(
    store: Store<any>,
    reducerManager: ReducerManager,
    @Inject(CATALOGUE_ENTITIES) entityGroups: StratosBaseCatalogueEntity[][],
    @Inject(SKIP_ENTITY_SECTION_INIT) skipEntityInit: boolean
  ) {
    const entities = [].concat.apply([], entityGroups) as StratosBaseCatalogueEntity[];
    // console.log('EffectsFeatureModule!!!!', entities.map(m => m.entityKey));
    const key = EntityCatalogueHelpers.buildEntityKey(endpointSchemaKey, STRATOS_ENDPOINT_TYPE);
    // console.log('EffectsFeatureModule!!!!2', entities.map(m => m.entityKey).indexOf(key));
    entities.forEach(entity => {
      // console.log('Registering: ', entity.entityKey);
      entityCatalogue.register(entity);
    });
    const dataReducer = requestDataReducerFactory(requestActions);
    const extraReducers = entityCatalogue.getAllEntityRequestDataReducers();
    const chainedReducers = chainApiReducers(dataReducer, extraReducers);
    // reducerManager.forEach(v => v.name)
    // reducerManager.
    reducerManager.addReducer('requestData', chainedReducers);
    if (skipEntityInit) {
      // console.warn('!!!!!!!!!!!!!!!!!: Skipping wipe!');
    } else {
      store.dispatch(new InitCatalogueEntitiesAction(entities));
    }
  }
}

@NgModule({})
export class EntityCatalogueModule {
  // TODO: this does not allow for lazy loading, work out if we can allow this.
  // https://github.com/cloudfoundry-incubator/stratos/issues/3741
  static forFeature(entityFactory: () => StratosBaseCatalogueEntity[]): ModuleWithProviders {
    // Note - If you place any code here before `return` you get funky errors.
    return {
      ngModule: EffectsFeatureModule,
      providers: [
        ReducerManager,
        Store,
        { provide: CATALOGUE_ENTITIES, useFactory: entityFactory, multi: true },
        { provide: SKIP_ENTITY_SECTION_INIT, useValue: false }
      ]
    };
  }
}
