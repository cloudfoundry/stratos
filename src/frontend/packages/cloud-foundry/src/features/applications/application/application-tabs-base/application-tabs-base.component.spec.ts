import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../../../core/src/core/core.module';
import { MDAppModule } from '../../../../../../core/src/core/md.module';
import { SharedModule } from '../../../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../../../core/src/tab-nav.service';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../../../../../git/src/shared/github.helpers';
import { generateTestApplicationServiceProvider } from '../../../../../test-framework/application-service-helper';
import { generateCfStoreModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationStateService } from '../../../../shared/services/application-state.service';
import { ApplicationTabsBaseComponent } from './application-tabs-base.component';
import { ApplicationEnvVarsHelper } from './tabs/build-tab/application-env-vars.service';

describe('ApplicationTabsBaseComponent', () => {
  let component: ApplicationTabsBaseComponent;
  let fixture: ComponentFixture<ApplicationTabsBaseComponent>;

  const appId = '1';
  const cfId = '2';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        ApplicationTabsBaseComponent,
      ],
      imports: [
        ...generateCfStoreModules(),
        StoreModule,
        CoreModule,
        SharedModule,
        NoopAnimationsModule,
        RouterTestingModule,
        MDAppModule,
        HttpClientModule,
        HttpClientTestingModule
      ],
      providers: [
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
