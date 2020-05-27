import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { createEmptyStoreModule } from '@stratos/store/testing';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { ApplicationService } from '../../../../../../../cloud-foundry/src/features/applications/application.service';
import { ApplicationServiceMock } from '../../../../../../../cloud-foundry/test-framework/application-service-helper';
import { CoreModule } from '../../../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../../../../core/tab-nav.service';
import { AppAutoscalerComboSeriesVerticalComponent } from './combo-series-vertical.component';

describe('AppAutoscalerComboSeriesVerticalComponent', () => {
  let component: AppAutoscalerComboSeriesVerticalComponent;
  let fixture: ComponentFixture<AppAutoscalerComboSeriesVerticalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppAutoscalerComboSeriesVerticalComponent],
      imports: [
        NoopAnimationsModule,
        createEmptyStoreModule(),
        CoreModule,
        SharedModule,
        RouterTestingModule,
        NgxChartsModule,
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
    fixture = TestBed.createComponent(AppAutoscalerComboSeriesVerticalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
