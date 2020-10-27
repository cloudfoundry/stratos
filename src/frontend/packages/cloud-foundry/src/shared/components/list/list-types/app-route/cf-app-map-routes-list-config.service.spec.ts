import { DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../../../core/src/shared/shared.module';
import { ApplicationServiceMock } from '../../../../../../test-framework/application-service-helper';
import { generateCfStoreModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { CfAppMapRoutesListConfigService } from './cf-app-map-routes-list-config.service';

describe('CfAppMapRoutesListConfigService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfAppMapRoutesListConfigService,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        DatePipe
      ],
      imports: [
        ...generateCfStoreModules(),
        SharedModule,
        CoreModule,
        RouterTestingModule,
        NoopAnimationsModule
      ]
    });
  });

  it(
    'should be created',
    inject(
      [CfAppMapRoutesListConfigService],
      (service: CfAppMapRoutesListConfigService) => {
        expect(service).toBeTruthy();
      }
    )
  );
});
