import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../../../core/core.module';
import { MDAppModule } from '../../../../../../core/md.module';
import { ApplicationStateService } from '../../../../../../shared/components/application-state/application-state.service';
import { LogViewerComponent } from '../../../../../../shared/components/log-viewer/log-viewer.component';
import { EntityMonitorFactory } from '../../../../../../shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../shared/monitors/pagination-monitor.factory';
import { GetApplication } from '../../../../../../store/actions/application.actions';
import { applicationSchemaKey, entityFactory } from '../../../../../../store/helpers/entity-factory';
import { AppStoreModule } from '../../../../../../store/store.module';
import { generateTestApplicationServiceProvider } from '../../../../../../test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../../../../../test-framework/entity-service.helper';
import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';
import { ApplicationEnvVarsService } from '../build-tab/application-env-vars.service';
import { LogStreamTabComponent } from './auto-scaler-tab.component';


describe('LogStreamTabComponent', () => {
  let component: LogStreamTabComponent;
  let fixture: ComponentFixture<LogStreamTabComponent>;

  const appId = '';
  const cfId = '2';

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        StoreModule,
        CoreModule,
        NoopAnimationsModule,
        RouterTestingModule,
        MDAppModule,
        createBasicStoreModule()
      ],
      declarations: [
        LogViewerComponent,
        LogStreamTabComponent
      ],
      providers: [
        generateTestEntityServiceProvider(
          appId,
          entityFactory(applicationSchemaKey),
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
