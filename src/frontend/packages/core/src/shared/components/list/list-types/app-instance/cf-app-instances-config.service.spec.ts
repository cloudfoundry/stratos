import { CommonModule } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { GetApplication } from '../../../../../../../cloud-foundry/src/actions/application.actions';
import { applicationEntityType, cfEntityFactory } from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { generateTestApplicationServiceProvider } from '../../../../../../test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../../../../../test-framework/entity-service.helper';
import { createBasicStoreModule, getInitialTestStoreState } from '../../../../../../test-framework/store-test-helper';
import { endpointEntitySchema } from '../../../../../base-entity-schemas';
import { CoreModule } from '../../../../../core/core.module';
import { entityCatalogue } from '../../../../../core/entity-catalogue/entity-catalogue.service';
import { CustomImportModule } from '../../../../../custom-import.module';
import { ApplicationsModule } from '../../../../../features/applications/applications.module';
import { SharedModule } from '../../../../shared.module';
import { CfAppInstancesConfigService } from './cf-app-instances-config.service';

describe('CfAppInstancesConfigService', () => {

  const initialState = getInitialTestStoreState();
  const endpointEntity = entityCatalogue.getEntity(endpointEntitySchema);
  const cfGuid = Object.keys(initialState.requestData[endpointEntity.entityKey])[0];
  const appGuid = Object.keys(initialState.requestData.cfApplication)[0];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfAppInstancesConfigService,
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
        ApplicationsModule,
        createBasicStoreModule(),
        RouterTestingModule,
      ]
    }).overrideModule(ApplicationsModule, {
      remove: {
        imports: [CustomImportModule]
      }
    });
  });

  it('should be created', inject([CfAppInstancesConfigService], (service: CfAppInstancesConfigService) => {
    expect(service).toBeTruthy();
  }));
});
