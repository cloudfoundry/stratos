import { NgModule } from '@angular/core';
// import { registerBaseStratosTypes } from '../../core/src/base-entity-types';

// registerBaseStratosTypes();

@NgModule()
export class AppStoreExtensionsModule {

  // Ensure extensions add their entities to the store
  // This module must be imported first by the store to ensure this is done
  // before other modules initialize
  constructor() {

  }

}
