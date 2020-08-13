import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../../core/tab-nav.service';
import { generateCfStoreModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationDeploySourceTypes } from '../deploy-application/deploy-application-steps.types';
import { NewApplicationBaseStepComponent } from './new-application-base-step.component';

describe('NewApplicationBaseStepComponent', () => {
  let component: NewApplicationBaseStepComponent;
  let fixture: ComponentFixture<NewApplicationBaseStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NewApplicationBaseStepComponent],
      imports: [
        ...generateCfStoreModules(),
        CoreModule,
        SharedModule,
        RouterTestingModule
      ],
      providers: [
        TabNavService,
        ApplicationDeploySourceTypes
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewApplicationBaseStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
