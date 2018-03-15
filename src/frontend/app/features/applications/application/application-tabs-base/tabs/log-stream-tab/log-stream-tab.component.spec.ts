import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../../../core/core.module';
import { MDAppModule } from '../../../../../../core/md.module';
import { ApplicationSchema, GetApplication } from '../../../../../../store/actions/application.actions';
import { appReducers } from '../../../../../../store/reducers.module';
import { AppStoreModule } from '../../../../../../store/store.module';
import { generateTestApplicationServiceProvider } from '../../../../../../test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../../../../../test-framework/entity-service.helper';
import { getInitialTestStoreState, createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';
import { ApplicationEnvVarsService } from '../build-tab/application-env-vars.service';
import { ApplicationStateService } from '../../../../../../shared/components/application-state/application-state.service';
import { LogStreamTabComponent } from './log-stream-tab.component';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { EntityMonitorFactory } from '../../../../../../shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../shared/monitors/pagination-monitor.factory';
import { LogStreamViewerComponent } from '../../../../../../shared/components/logstream-viewer/logstream-viewer.component';


describe('LogStreamTabComponent', () => {
  let component: LogStreamTabComponent;
  let fixture: ComponentFixture<LogStreamTabComponent>;

  const appId = '1';
  const cfId = '2';

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        StoreModule,
        CoreModule,
        BrowserAnimationsModule,
        RouterTestingModule,
        MDAppModule,
        createBasicStoreModule()
      ],
      declarations: [
        LogStreamViewerComponent,
        LogStreamTabComponent
      ],
      providers: [
        generateTestEntityServiceProvider(
          appId,
          ApplicationSchema,
          new GetApplication(appId, cfId)
        ),
        generateTestApplicationServiceProvider(cfId, appId),
        AppStoreModule,
        ApplicationStateService,
        ApplicationEnvVarsService,
        EntityMonitorFactory,
        PaginationMonitorFactory
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogStreamTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
