import { NgModule } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  CATALOGUE_ENTITIES,
  entityCatalog,
  EntityCatalogFeatureModule,
  TestEntityCatalog,
} from '../../../store/src/public-api';
import { generateStratosEntities } from '../../../store/src/stratos-entity-generator';
import { HelmReleaseGuid } from '../kubernetes/workloads/workload.types';
import { generateHelmEntities } from './helm-entity-generator';


@NgModule({
  imports: [
    EntityCatalogFeatureModule,
  ],
  providers: [
    {
      provide: CATALOGUE_ENTITIES,
      useFactory: () => {
        const testEntityCatalog = entityCatalog as TestEntityCatalog;
        testEntityCatalog.clear();
        return [
          ...generateStratosEntities(),
          ...generateHelmEntities(),
        ];
      },
      multi: true
    }
  ]
})
export class HelmTestingModule { }


export const HelmReleaseActivatedRouteMock = {
  provide: ActivatedRoute,
  useValue: {
    snapshot: {
      queryParams: {},
      params: {
        guid: '123:4'
      }
    }
  }
};

export const HelmReleaseGuidMock = {
  provide: HelmReleaseGuid,
  useValue: {
    guid: '123:4'
  }
};

