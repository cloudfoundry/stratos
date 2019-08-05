import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { ApplicationService } from '../../../../../core/src/features/applications/application.service';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../../core/tab-nav.service';
import { ApplicationServiceMock } from '../../../../../core/test-framework/application-service-helper';
import { createEmptyStoreModule } from '../../../../../core/test-framework/store-test-helper';
import { AppStoreExtensionsModule } from '../../../../../store/src/store.extensions.module';
import { CfAutoscalerTestingModule } from '../../../cf-autoscaler-testing.module';
import { EditAutoscalerPolicyService } from '../edit-autoscaler-policy-service';
import { EditAutoscalerPolicyStep4Component } from './edit-autoscaler-policy-step4.component';

describe('EditAutoscalerPolicyStep4Component', () => {
  let component: EditAutoscalerPolicyStep4Component;
  let fixture: ComponentFixture<EditAutoscalerPolicyStep4Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditAutoscalerPolicyStep4Component],
      imports: [
        AppStoreExtensionsModule,
        CfAutoscalerTestingModule,
        BrowserAnimationsModule,
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
    fixture = TestBed.createComponent(EditAutoscalerPolicyStep4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
