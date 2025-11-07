import { NgModule } from '@angular/core';
import {
  CATALOGUE_ENTITIES,
  EntityCatalogFeatureModule,
  generateStratosEntities,
} from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';

@NgModule({
  imports: [
    EntityCatalogFeatureModule,
  ],
  providers: [
    ...STORE_TEST_PROVIDERS,
    {
      provide: CATALOGUE_ENTITIES,
      useFactory: () => [
        ...generateStratosEntities()
      ],
      multi: true
    },
  ]
})
export class CoreTestingModule { }
