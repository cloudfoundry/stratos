import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GetApplication } from '../../../../../../cloud-foundry/src/actions/application.actions';
import { cfEntityFactory } from '../../../../../../cloud-foundry/src/cf-entity-factory';
import { generateTestEntityServiceProvider } from '../../../../../../core/test-framework/entity-service.helper';
import { generateTestApplicationServiceProvider } from '../../../../../test-framework/application-service-helper';
import { generateCfBaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { applicationEntityType } from '../../../../cf-entity-types';
import { ServiceActionHelperService } from '../../../../shared/data-services/service-action-helper.service';
import {
  ApplicationEnvVarsHelper,
} from '../../application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { ApplicationStateService } from './../../../../shared/services/application-state.service';
import { DeleteAppServiceInstancesComponent } from './delete-app-instances.component';

describe('DeleteAppInstancesComponent', () => {
  let component: DeleteAppServiceInstancesComponent;
  let fixture: ComponentFixture<DeleteAppServiceInstancesComponent>;
  const appId = '1';
  const cfId = '2';
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DeleteAppServiceInstancesComponent],
      imports: generateCfBaseTestModules(),
      providers: [
        generateTestEntityServiceProvider(
          appId,
          cfEntityFactory(applicationEntityType),
          new GetApplication(appId, cfId)
        ),
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationEnvVarsHelper,
        DatePipe,
        ServiceActionHelperService,
        ApplicationStateService,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteAppServiceInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
