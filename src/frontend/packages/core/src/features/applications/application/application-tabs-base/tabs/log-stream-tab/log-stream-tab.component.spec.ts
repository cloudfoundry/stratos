import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { LogStreamTabComponent } from './log-stream-tab.component';
import { StoreModule } from '@ngrx/store';
import { CoreModule } from '../../../../../../core/core.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { MDAppModule } from '../../../../../../core/md.module';
import { createBasicStoreModule } from '../../../../../../../test-framework/store-test-helper';
import { LogViewerComponent } from '../../../../../../shared/components/log-viewer/log-viewer.component';
import { generateTestEntityServiceProvider } from '../../../../../../../test-framework/entity-service.helper';
import { entityFactory, applicationSchemaKey } from '../../../../../../../../store/src/helpers/entity-factory';
import { GetApplication } from '../../../../../../../../store/src/actions/application.actions';
import { generateTestApplicationServiceProvider } from '../../../../../../../test-framework/application-service-helper';
import { AppStoreModule } from '../../../../../../../../store/src/store.module';
import { ApplicationStateService } from '../../../../../../shared/components/application-state/application-state.service';
import { ApplicationEnvVarsHelper } from '../build-tab/application-env-vars.service';
import { EntityMonitorFactory } from '../../../../../../shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../shared/monitors/pagination-monitor.factory';

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
        ApplicationEnvVarsHelper,
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
