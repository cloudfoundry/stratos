import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { ApplicationService } from '../../../../../core/src/features/applications/application.service';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../../core/tab-nav.service';
import { ApplicationServiceMock } from '../../../../../core/test-framework/application-service-helper';
import { createBasicStoreModule } from '../../../../../core/test-framework/store-test-helper';
import { CfAutoscalerTestingModule } from '../../../cf-autoscaler-testing.module';
import { EditAutoscalerPolicyStep3Component } from './edit-autoscaler-policy-step3.component';
import { EditAutoscalerPolicyService } from '../edit-autoscaler-policy-service';

describe('EditAutoscalerPolicyStep3Component', () => {
  let component: EditAutoscalerPolicyStep3Component;
  let fixture: ComponentFixture<EditAutoscalerPolicyStep3Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditAutoscalerPolicyStep3Component],
      imports: [
        BrowserAnimationsModule,
        createBasicStoreModule(),
        CoreModule,
        SharedModule,
        RouterTestingModule,
        CfAutoscalerTestingModule
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
    fixture = TestBed.createComponent(EditAutoscalerPolicyStep3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
