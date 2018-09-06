import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../core/core.module';
import { MDAppModule } from '../../../core/md.module';
import { ApplicationStateService } from '../../../shared/components/application-state/application-state.service';
import { SharedModule } from '../../../shared/shared.module';
import { GetApplication } from '../../../store/actions/application.actions';
import { applicationSchemaKey, entityFactory } from '../../../store/helpers/entity-factory';
import { generateTestApplicationServiceProvider } from '../../../test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../../test-framework/entity-service.helper';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { ApplicationEnvVarsHelper } from '../application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { CliInfoApplicationComponent } from './cli-info-application.component';

describe('CliInfoApplicationComponent', () => {
  let component: CliInfoApplicationComponent;
  let fixture: ComponentFixture<CliInfoApplicationComponent>;

  const appId = '1';
  const cfId = '2';

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CliInfoApplicationComponent],
      imports: [
        CoreModule,
        SharedModule,
        MDAppModule,
        RouterTestingModule,
        createBasicStoreModule()
      ],
      providers: [
        generateTestEntityServiceProvider(
          appId,
          entityFactory(applicationSchemaKey),
          new GetApplication(appId, cfId)
        ),
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationStateService,
        ApplicationEnvVarsHelper
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CliInfoApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
