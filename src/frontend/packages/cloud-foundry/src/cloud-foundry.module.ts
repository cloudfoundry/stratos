import { NgModule } from '@angular/core';
import { EntityCatalogueService } from '../../core/src/core/entity-catalogue/entity-catalogue.service';
import {
  CloudFoundryComponentsModule
} from './shared/components/components.module';
import { generateCFEntities } from './cf-entity-generator';

@NgModule({
  imports: [
    CloudFoundryComponentsModule
  ],
})
export class CloudFoundryPackageModule {
  constructor(
    private entityCatalogueService: EntityCatalogueService
  ) {
    this.registerCfFavoriteEntities();
  }
  private registerCfFavoriteEntities() {
    generateCFEntities().forEach(entity => this.entityCatalogueService.register(entity));
  }

}
