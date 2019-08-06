import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { GetApplication } from '../../../../../../cloud-foundry/src/actions/application.actions';
import { applicationEntityType, cfEntityFactory } from '../../../../../../cloud-foundry/src/cf-entity-factory';
import { CoreModule } from '../../../../../../core/src/core/core.module';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../../../../../core/src/core/github.helpers';
import { MDAppModule } from '../../../../../../core/src/core/md.module';
import {
  ApplicationStateService,
} from '../../../../../../core/src/shared/components/application-state/application-state.service';
import { SharedModule } from '../../../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../../../core/tab-nav.service';
import { generateTestApplicationServiceProvider } from '../../../../../../core/test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../../../../../core/test-framework/entity-service.helper';
import { createBasicStoreModule } from '../../../../../../core/test-framework/store-test-helper';
import { ApplicationTabsBaseComponent } from './application-tabs-base.component';
import { ApplicationEnvVarsHelper } from './tabs/build-tab/application-env-vars.service';

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
          cfEntityFactory(applicationEntityType),
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
