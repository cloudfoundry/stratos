import { NgModule } from '@angular/core';

// TODO: NJ? Is this needed any more?
@NgModule()
export class AppStoreExtensionsModule {

  // Ensure extensions add their entities to the store
  // This module must be imported first by the store to ensure this is done
  // before other modules initialize
  constructor() {

  }

}
