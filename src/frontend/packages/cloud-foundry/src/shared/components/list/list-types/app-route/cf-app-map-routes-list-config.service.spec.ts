import { DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../../../core/src/shared/shared.module';
import { ApplicationServiceMock } from '../../../../../../../core/test-framework/application-service-helper';
import { getInitialTestStoreState } from '../../../../../../../core/test-framework/store-test-helper';
import { appReducers } from '../../../../../../../store/src/reducers.module';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { CfAppMapRoutesListConfigService } from './cf-app-map-routes-list-config.service';

describe('CfAppMapRoutesListConfigService', () => {
  const initialState = { ...getInitialTestStoreState() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfAppMapRoutesListConfigService,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        DatePipe
      ],
      imports: [
        SharedModule,
        CoreModule,
        RouterTestingModule,
        StoreModule.forRoot(appReducers, {
          initialState
        }),
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
