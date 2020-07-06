import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { GITHUB_API_URL } from '../../../../../../../../core/src/core/github.helpers';
import { APP_GUID, CF_GUID } from '../../../../../../../../core/src/shared/entity.tokens';
import { SharedModule } from '../../../../../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../../../../../core/tab-nav.service';
import { AppStoreModule } from '../../../../../../../../store/src/store.module';
import { ApplicationServiceMock } from '../../../../../../../test-framework/application-service-helper';
import { generateCfStoreModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundrySharedModule } from '../../../../../../shared/cf-shared.module';
import { ApplicationStateService } from '../../../../../../shared/services/application-state.service';
import { ApplicationService } from '../../../../application.service';
import { ApplicationPollComponent } from '../../application-poll/application-poll.component';
import { ApplicationPollingService } from '../../application-polling.service';
import { ApplicationEnvVarsHelper } from './application-env-vars.service';
import { BuildTabComponent } from './build-tab.component';
import { ViewBuildpackComponent } from './view-buildpack/view-buildpack.component';

describe('BuildTabComponent', () => {
  let component: BuildTabComponent;
  let fixture: ComponentFixture<BuildTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        BuildTabComponent,
        ViewBuildpackComponent,
        ApplicationPollComponent,
      ],
      imports: [
        ...generateCfStoreModules(),
        CoreModule,
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule,
        HttpClientModule,
        HttpClientTestingModule,
        CloudFoundrySharedModule
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
        ApplicationPollingService
      ]
    })
      .compileComponents();
  }));

  beforeEach(inject([ApplicationService], (applicationService: ApplicationService) => {
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
