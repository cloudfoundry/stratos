import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { appReducers } from '../../../../../../../../store/src/reducers.module';
import { AppStoreModule } from '../../../../../../../../store/src/store.module';
import { endpointStoreNames } from '../../../../../../../../store/src/types/endpoint.types';
import { TabNavService } from '../../../../../../../tab-nav.service';
import { ApplicationServiceMock } from '../../../../../../../test-framework/application-service-helper';
import { getInitialTestStoreState } from '../../../../../../../test-framework/store-test-helper';
import { CoreModule } from '../../../../../../core/core.module';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import { GITHUB_API_URL } from '../../../../../../core/github.helpers';
import { ApplicationStateService } from '../../../../../../shared/components/application-state/application-state.service';
import { APP_GUID, CF_GUID, ENTITY_SERVICE } from '../../../../../../shared/entity.tokens';
import { SharedModule } from '../../../../../../shared/shared.module';
import { ApplicationService } from '../../../../application.service';
import { entityServiceFactory } from '../../../application-base.component';
import { ApplicationPollComponent } from '../../application-poll/application-poll.component';
import { ApplicationPollingService } from '../../application-polling.service';
import { ApplicationEnvVarsHelper } from './application-env-vars.service';
import { BuildTabComponent } from './build-tab.component';
import { ViewBuildpackComponent } from './view-buildpack/view-buildpack.component';

describe('BuildTabComponent', () => {
  let component: BuildTabComponent;
  let fixture: ComponentFixture<BuildTabComponent>;
  const initialState = getInitialTestStoreState();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        BuildTabComponent,
        ViewBuildpackComponent,
        ApplicationPollComponent
      ],
      imports: [
        CoreModule,
        SharedModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        StoreModule.forRoot(
          appReducers,
          {
            initialState
          }
        ),
        HttpClientModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        AppStoreModule,
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        { provide: GITHUB_API_URL, useValue: null },
        TabNavService,
        { provide: CF_GUID, useValue: '' },
        { provide: APP_GUID, useValue: '' },
        {
          provide: ENTITY_SERVICE,
          useFactory: entityServiceFactory,
          deps: [CF_GUID, APP_GUID, EntityServiceFactory]
        },
        ApplicationPollingService
      ]
    })
      .compileComponents();
  }));

  beforeEach(inject([ApplicationService], (applicationService: ApplicationService) => {
    const cfGuid = Object.keys(initialState.requestData[endpointStoreNames.type])[0];
    const appGuid = Object.keys(initialState.requestData.application)[0];
    fixture = TestBed.createComponent(BuildTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
