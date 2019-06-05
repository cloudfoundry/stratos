import { NgModule } from '@angular/core';
import {
  CloudFoundryComponentsModule
} from './shared/components/components.module';
import { registerCFEntities } from './cf-entity-generator';
@NgModule({
  imports: [
    CloudFoundryComponentsModule
  ],
})
export class CloudFoundryPackageModule {
  constructor() {
    this.registerCfFavoriteEntities();
  }
  private registerCfFavoriteEntities() {
    registerCFEntities();
  }

}
