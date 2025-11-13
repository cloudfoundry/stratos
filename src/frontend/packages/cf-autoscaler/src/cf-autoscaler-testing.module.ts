import { NgModule } from '@angular/core';
import { generateCFEntities } from '@stratosui/cloud-foundry';
import { CATALOGUE_ENTITIES, EntityCatalogFeatureModule, entityCatalog, TestEntityCatalog, EntityCatalogProvidersModule } from '@stratosui/store';
import { generateASEntities } from './store/autoscaler-entity-generator';

@NgModule({
  imports: [
    EntityCatalogFeatureModule,
    EntityCatalogProvidersModule
  ],
  providers: [
    {
      provide: CATALOGUE_ENTITIES,
      useFactory: () => {
        const testEntityCatalog = entityCatalog as TestEntityCatalog;
        testEntityCatalog.clear();
        return [
          ...generateASEntities(),
          ...generateCFEntities()// depends on cf app type a lot
        ];
      },
      multi: true
    }
  ]
})
export class CfAutoscalerTestingModule { }
