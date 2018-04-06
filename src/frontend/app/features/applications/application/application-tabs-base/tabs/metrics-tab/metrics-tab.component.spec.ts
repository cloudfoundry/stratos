import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricsTabComponent } from './metrics-tab.component';
import { SharedModule } from '../../../../../../shared/shared.module';
import { MDAppModule } from '../../../../../../core/md.module';
import { generateTestEntityServiceProvider } from '../../../../../../test-framework/entity-service.helper';
import { entityFactory, applicationSchemaKey } from '../../../../../../store/helpers/entity-factory';
import { GetApplication } from '../../../../../../store/actions/application.actions';
import { generateTestApplicationServiceProvider } from '../../../../../../test-framework/application-service-helper';
import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';
import { StoreModule } from '@ngrx/store';
import { ApplicationStateService } from '../../../../../../shared/components/application-state/application-state.service';
import { ApplicationEnvVarsService } from '../build-tab/application-env-vars.service';

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
      ],
      providers: [
        ApplicationStateService,
        ApplicationEnvVarsService,
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
