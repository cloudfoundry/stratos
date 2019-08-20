import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { GetApplication } from '../../../../../../../../cloud-foundry/src/actions/application.actions';
import { applicationEntityType, cfEntityFactory } from '../../../../../../../../cloud-foundry/src/cf-entity-factory';
import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { MDAppModule } from '../../../../../../../../core/src/core/md.module';
import {
  ApplicationStateService,
} from '../../../../../../../../core/src/shared/components/application-state/application-state.service';
import { LogViewerComponent } from '../../../../../../../../core/src/shared/components/log-viewer/log-viewer.component';
import { EntityMonitorFactory } from '../../../../../../../../core/src/shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../../../../core/src/shared/monitors/pagination-monitor.factory';
import {
  generateTestApplicationServiceProvider,
} from '../../../../../../../../core/test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../../../../../../../core/test-framework/entity-service.helper';
import { createBasicStoreModule } from '../../../../../../../../core/test-framework/store-test-helper';
import { AppStoreModule } from '../../../../../../../../store/src/store.module';
import { ApplicationEnvVarsHelper } from '../build-tab/application-env-vars.service';
import { LogStreamTabComponent } from './log-stream-tab.component';

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
          cfEntityFactory(applicationEntityType),
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
