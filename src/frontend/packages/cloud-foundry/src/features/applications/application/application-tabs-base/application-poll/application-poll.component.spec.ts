import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { generateTestEntityServiceProvider } from '../../../../../../../core/test-framework/entity-service.helper';
import { generateTestApplicationServiceProvider } from '../../../../../../test-framework/application-service-helper';
import { generateCfBaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { GetApplication } from '../../../../../actions/application.actions';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { applicationEntityType } from '../../../../../cf-entity-types';
import { ApplicationPollingService } from '../application-polling.service';
import { ApplicationEnvVarsHelper } from '../tabs/build-tab/application-env-vars.service';
import { ApplicationStateService } from './../../../../../shared/services/application-state.service';
import { ApplicationPollComponent } from './application-poll.component';

describe('ApplicationPollComponent', () => {
  let component: ApplicationPollComponent;
  let fixture: ComponentFixture<ApplicationPollComponent>;

  const appId = '1';
  const cfId = '2';

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ApplicationPollComponent],
      providers: [
        ApplicationPollingService,
        generateTestEntityServiceProvider(
          appId,
          cfEntityFactory(applicationEntityType),
          new GetApplication(appId, cfId)
        ),
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationEnvVarsHelper,
        ApplicationStateService,
      ],
      imports: generateCfBaseTestModules()
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationPollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
