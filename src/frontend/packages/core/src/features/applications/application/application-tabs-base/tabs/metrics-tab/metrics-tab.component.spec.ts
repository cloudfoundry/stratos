import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { GetApplication } from '../../../../../../../../store/src/actions/application.actions';
import { applicationSchemaKey, entityFactory } from '../../../../../../../../store/src/helpers/entity-factory';
import { generateTestApplicationServiceProvider } from '../../../../../../../test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../../../../../../test-framework/entity-service.helper';
import { createBasicStoreModule } from '../../../../../../../test-framework/store-test-helper';
import { MDAppModule } from '../../../../../../core/md.module';
import { ApplicationStateService } from '../../../../../../shared/components/application-state/application-state.service';
import { SharedModule } from '../../../../../../shared/shared.module';
import { ApplicationEnvVarsHelper } from '../build-tab/application-env-vars.service';
import { MetricsTabComponent } from './metrics-tab.component';

describe('MetricsTabComponent', () => {
  let component: MetricsTabComponent;
  let fixture: ComponentFixture<MetricsTabComponent>;
  const appId = '1';
  const cfId = '2';
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MetricsTabComponent],
      imports: [
        createBasicStoreModule(),
        SharedModule,
        MDAppModule,
        NoopAnimationsModule
      ],
      providers: [
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        generateTestEntityServiceProvider(
          appId,
          entityFactory(applicationSchemaKey),
          new GetApplication(appId, cfId)
        ),
        generateTestApplicationServiceProvider(cfId, appId),
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetricsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
