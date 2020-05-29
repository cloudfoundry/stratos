import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { createEmptyStoreModule } from '@stratos/store/testing';

import { ApplicationService } from '../../../cloud-foundry/src/features/applications/application.service';
import { ApplicationServiceMock } from '../../../cloud-foundry/test-framework/application-service-helper';
import { CoreModule } from '../../../core/src/core/core.module';
import { SharedModule } from '../../../core/src/shared/shared.module';
import { TabNavService } from '../../../core/tab-nav.service';
import { CfAutoscalerTestingModule } from '../cf-autoscaler-testing.module';
import { AutoscalerBaseComponent } from './autoscaler-base.component';

describe('AutoscalerBaseComponent', () => {
  let component: AutoscalerBaseComponent;
  let fixture: ComponentFixture<AutoscalerBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AutoscalerBaseComponent],
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
        TabNavService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoscalerBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
