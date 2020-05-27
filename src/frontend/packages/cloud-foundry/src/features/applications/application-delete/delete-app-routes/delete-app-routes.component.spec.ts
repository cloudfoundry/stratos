import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GetApplication } from '../../../../../../cloud-foundry/src/actions/application.actions';
import { cfEntityFactory } from '../../../../../../cloud-foundry/src/cf-entity-factory';
import { generateTestEntityServiceProvider } from '../../../../../../core/test-framework/entity-service.helper';
import { generateTestApplicationServiceProvider } from '../../../../../test-framework/application-service-helper';
import { generateCfBaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { applicationEntityType } from '../../../../cf-entity-types';
import {
  ApplicationEnvVarsHelper,
} from '../../application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { ApplicationStateService } from './../../../../shared/services/application-state.service';
import { DeleteAppRoutesComponent } from './delete-app-routes.component';

describe('DeleteAppRoutesComponent', () => {
  let component: DeleteAppRoutesComponent;
  let fixture: ComponentFixture<DeleteAppRoutesComponent>;
  const appId = '1';
  const cfId = '2';
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DeleteAppRoutesComponent],
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
        ApplicationStateService
      ]

    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteAppRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterAll(() => { });
});
