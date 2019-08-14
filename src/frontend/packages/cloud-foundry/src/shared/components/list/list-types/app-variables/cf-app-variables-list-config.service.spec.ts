import { CommonModule } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { endpointEntitySchema } from '../../../../../../../core/src/base-entity-schemas';
import { CoreModule } from '../../../../../../../core/src/core/core.module';
import { entityCatalogue } from '../../../../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { CustomImportModule } from '../../../../../../../core/src/custom-import.module';
import { SharedModule } from '../../../../../../../core/src/shared/shared.module';
import { generateTestApplicationServiceProvider } from '../../../../../../../core/test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../../../../../../core/test-framework/entity-service.helper';
import {
  createBasicStoreModule,
  getInitialTestStoreState,
} from '../../../../../../../core/test-framework/store-test-helper';
import { GetApplication } from '../../../../../actions/application.actions';
import { applicationEntityType, cfEntityFactory } from '../../../../../cf-entity-factory';
import { ApplicationsModule } from '../../../../../features/applications/applications.module';
import { CfAppVariablesListConfigService } from './cf-app-variables-list-config.service';

describe('CfAppVariablesListConfigService', () => {

  const initialState = getInitialTestStoreState();
  const endpointEntity = entityCatalogue.getEntity(endpointEntitySchema);
  const cfGuid = Object.keys(initialState.requestData[endpointEntity.entityKey])[0];
  const appGuid = Object.keys(initialState.requestData.cfApplication)[0];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfAppVariablesListConfigService,
        generateTestEntityServiceProvider(
          appGuid,
          cfEntityFactory(applicationEntityType),
          new GetApplication(appGuid, cfGuid)
        ),
        generateTestApplicationServiceProvider(appGuid, cfGuid)
      ],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
        ApplicationsModule,
        RouterTestingModule
      ]
    }).overrideModule(ApplicationsModule, {
      remove: {
        imports: [CustomImportModule]
      }
    });
  });

  it('should be created', inject(
    [CfAppVariablesListConfigService],
    (service: CfAppVariablesListConfigService) => {
      expect(service).toBeTruthy();
    }));
});
