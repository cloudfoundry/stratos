import { addExtensionEntities } from './helpers/entity-extensions';
import { NgModule } from '@angular/core';
import { initStore } from './helpers/store-helpers';
import { ExtensionService } from '../../core/src/core/extension/extension-service';
import { entityCatalogue } from '../../core/src/core/entity-catalogue/entity-catalogue.service';

@NgModule({})
export class AppStoreExtensionsModule {

  // Ensure extensions add their entities to the store
  // This module must be imported first by the store to ensure this is done
  // before other modules initialize
  constructor( ) {
    addExtensionEntities(entityCatalogue);
    initStore();
  }

}
