import { DatePipe } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { ApplicationService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock } from '@test-framework/cf';
import { CoreModule, TabNavService } from '@stratosui/core';
import { generateBaseTestStoreModules } from '@test-framework/core-test.helper';
import { CfAutoscalerTestingModule } from '../../../../../cf-autoscaler-testing.module';
import { AppAutoscalerComboSeriesVerticalComponent } from './combo-series-vertical.component';

describe('AppAutoscalerComboSeriesVerticalComponent', () => {
  let component: AppAutoscalerComboSeriesVerticalComponent;
  let fixture: ComponentFixture<AppAutoscalerComboSeriesVerticalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AppAutoscalerComboSeriesVerticalComponent,
      ],
      providers: [
        importProvidersFrom(
          CfAutoscalerTestingModule,
          ...generateBaseTestStoreModules(),
          CoreModule,
          NoopAnimationsModule
        ),
        provideRouter([]),
        DatePipe,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService,
        provideZonelessChangeDetection(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppAutoscalerComboSeriesVerticalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
