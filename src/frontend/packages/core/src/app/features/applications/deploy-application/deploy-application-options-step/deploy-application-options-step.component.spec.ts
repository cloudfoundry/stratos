import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../../shared/shared.module';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import {
  ApplicationEnvVarsHelper,
} from '../../application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { DeployApplicationOptionsStepComponent } from './deploy-application-options-step.component';

describe('DeployApplicationOptionsStepComponent', () => {
  let component: DeployApplicationOptionsStepComponent;
  let fixture: ComponentFixture<DeployApplicationOptionsStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DeployApplicationOptionsStepComponent],
      providers: [ApplicationEnvVarsHelper],
      imports: [
        CoreModule,
        SharedModule,
        RouterTestingModule,
        createBasicStoreModule(),
        NoopAnimationsModule,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeployApplicationOptionsStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
