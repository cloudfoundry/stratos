import { inject, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../../core/core.module';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { appReducers } from '../../../../../store/reducers.module';
import { ApplicationServiceMock } from '../../../../../test-framework/application-service-helper';
import { getInitialTestStoreState } from '../../../../../test-framework/store-test-helper';
import { SharedModule } from '../../../../shared.module';
import { CfAppMapRoutesListConfigService } from './cf-app-map-routes-list-config.service';

describe('CfAppMapRoutesListConfigService', () => {
  const initialState = { ...getInitialTestStoreState() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfAppMapRoutesListConfigService,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
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

  it('should be created', inject([CfAppMapRoutesListConfigService], (service: CfAppMapRoutesListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
