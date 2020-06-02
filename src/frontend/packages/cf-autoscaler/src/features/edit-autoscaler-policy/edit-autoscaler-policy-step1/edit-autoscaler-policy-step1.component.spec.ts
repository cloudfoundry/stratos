import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { createEmptyStoreModule } from '@stratos/store/testing';

import { ApplicationService } from '../../../../../cloud-foundry/src/features/applications/application.service';
import { ApplicationServiceMock } from '../../../../../cloud-foundry/test-framework/application-service-helper';
import { CoreModule } from '../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../../core/tab-nav.service';
import { CfAutoscalerTestingModule } from '../../../cf-autoscaler-testing.module';
import { EditAutoscalerPolicyService } from '../edit-autoscaler-policy-service';
import { EditAutoscalerPolicyStep1Component } from './edit-autoscaler-policy-step1.component';

describe('EditAutoscalerPolicyStep1Component', () => {
  let component: EditAutoscalerPolicyStep1Component;
  let fixture: ComponentFixture<EditAutoscalerPolicyStep1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditAutoscalerPolicyStep1Component],
      imports: [
        CfAutoscalerTestingModule,
        NoopAnimationsModule,
        createEmptyStoreModule(),
        CoreModule,
        SharedModule,
        RouterTestingModule,
      ],
      providers: [
        DatePipe,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService,
        EditAutoscalerPolicyService,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditAutoscalerPolicyStep1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  afterAll(() => { });
});
