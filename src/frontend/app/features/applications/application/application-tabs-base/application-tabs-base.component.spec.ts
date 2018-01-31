import { AppStoreModule } from '../../../../store/store.module';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../core/core.module';
import { MDAppModule } from '../../../../core/md.module';
import { SharedModule } from '../../../../shared/shared.module';
import { appReducers } from '../../../../store/reducers.module';
import { getInitialTestStoreState, createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { ApplicationEnvVarsService } from './../application-tabs-base/tabs/build-tab/application-env-vars.service';
import { ApplicationStateService } from '../../../../shared/components/application-state/application-state.service';
import { ApplicationTabsBaseComponent } from './application-tabs-base.component';
import { ApplicationService } from '../../application.service';
import { generateTestApplicationServiceProvider } from '../../../../test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../../../test-framework/entity-service.helper';
import { ApplicationSchema, GetApplication } from '../../../../store/actions/application.actions';

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
        createBasicStoreModule()
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
