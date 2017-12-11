import { ApplicationEnvVarsService } from './application/build-tab/application-env-vars.service';
import { ApplicationStateService } from './application/build-tab/application-state/application-state.service';
import { ApplicationModule } from '@angular/core';
import { generateTestEntityServiceProvider } from '../../test-framework/entity-service.helper';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { ApplicationSchema, GetApplication } from '../../store/actions/application.actions';
import { it } from '@angular/cli/lib/ast-tools/spec-utils';
import { EntityService } from '../../core/entity-service';
import { inject, TestBed } from '@angular/core/testing';

import { AppStoreModule } from '../../store/store.module';
import { ApplicationService } from './application.service';
import { ApplicationsModule } from './applications.module';
import { RouterTestingModule } from '@angular/router/testing';
import { generateTestApplicationServiceProvider } from '../../test-framework/application-service-helper';
import { CoreModule } from '../../core/core.module';

describe('ApplicationService', () => {

  const appId = '1';
  const cfId = '2';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        AppStoreModule,
        RouterTestingModule,
      ],
      providers: [
        generateTestEntityServiceProvider(
          appId,
          ApplicationSchema,
          new GetApplication(appId, cfId)
        ),
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationStateService,
        ApplicationEnvVarsService
      ]
    });
  });

  it('should be created', inject([ApplicationService], (service: ApplicationService) => {
    expect(service).toBeTruthy();
  }));
});
