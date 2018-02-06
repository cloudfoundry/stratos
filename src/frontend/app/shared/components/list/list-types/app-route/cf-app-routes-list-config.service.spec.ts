import { TestBed, inject } from '@angular/core/testing';

import { CfAppRoutesListConfigService } from './cf-app-routes-list-config.service';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { ApplicationServiceMock } from '../../../../../test-framework/application-service-helper';
import { CoreModule } from '../../../../../core/core.module';
import { SharedModule } from '../../../../shared.module';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../../../store/reducers.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { getInitialTestStoreState } from '../../../../../test-framework/store-test-helper';

describe('CfAppRoutesListConfigService', () => {

  const initialState = { ...getInitialTestStoreState() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        CfAppRoutesListConfigService
      ],
      imports: [
        SharedModule,
        CoreModule,
        StoreModule.forRoot(
          appReducers,
          {
            initialState
          }
        ),
        NoopAnimationsModule,
      ]
    });
  });

  it('should be created', inject([CfAppRoutesListConfigService], (service: CfAppRoutesListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
