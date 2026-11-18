import { NgModule } from '@angular/core';
import {
  CATALOGUE_ENTITIES,
  EntityCatalogFeatureModule,
} from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCoreStratosEntities } from '../src/features/metrics/metrics-endpoint';
import { generateMockTestEntities } from './mock-catalog-entities';

@NgModule({
  imports: [
    EntityCatalogFeatureModule,
  ],
  providers: [
    ...STORE_TEST_PROVIDERS,
    {
      provide: CATALOGUE_ENTITIES,
      useFactory: () => [
        ...generateCoreStratosEntities(),
        // Include mock CF and K8s entities to prevent catalog lookup warnings in tests
        // These are lightweight stubs that don't require importing full CF/K8s packages
        ...generateMockTestEntities()
      ],
      multi: true
    },
  ]
})
export class CoreTestingModule { }
