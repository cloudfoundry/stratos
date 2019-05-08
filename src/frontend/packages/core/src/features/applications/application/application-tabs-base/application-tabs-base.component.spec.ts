import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { GetApplication } from '../../../../../../store/src/actions/application.actions';
import { applicationSchemaKey, entityFactory } from '../../../../../../store/src/helpers/entity-factory';
import { TabNavService } from '../../../../../tab-nav.service';
import { generateTestApplicationServiceProvider } from '../../../../../test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../../../../test-framework/entity-service.helper';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { CoreModule } from '../../../../core/core.module';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../../../core/github.helpers';
import { MDAppModule } from '../../../../core/md.module';
import { ApplicationStateService } from '../../../../shared/components/application-state/application-state.service';
import { SharedModule } from '../../../../shared/shared.module';
import { ApplicationEnvVarsHelper } from './../application-tabs-base/tabs/build-tab/application-env-vars.service';
import { ApplicationTabsBaseComponent } from './application-tabs-base.component';

describe('ApplicationTabsBaseComponent', () => {
  let component: ApplicationTabsBaseComponent;
  let fixture: ComponentFixture<ApplicationTabsBaseComponent>;

  const appId = '1';
  const cfId = '2';

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ApplicationTabsBaseComponent,
      ],
      imports: [
        StoreModule,
        CoreModule,
        SharedModule,
        BrowserAnimationsModule,
        RouterTestingModule,
        MDAppModule,
        createBasicStoreModule(),
        HttpClientModule,
        HttpClientTestingModule
      ],
      providers: [
        generateTestEntityServiceProvider(
          appId,
          entityFactory(applicationSchemaKey),
          new GetApplication(appId, cfId)
        ),
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        TabNavService
      ]
    })
      .compileComponents();
  }));


  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationTabsBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
