import { NgModule } from '@angular/core';
import { EntityCatalogueModule } from '../core/src/core/entity-catalogue.module';
import { generateExampleEntities } from './example-api-entity.generators';

@NgModule({
  imports: [
    EntityCatalogueModule.forFeature(generateExampleEntities),
  ]
})
export class ExampleApiPackageModule { }
