import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { createEmptyStoreModule } from "@test-framework/cf-autoscaler-test.helper";

import { ApplicationService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock } from '@stratosui/cloud-foundry/testing';
import { CoreModule, CurrentUserPermissionsService, SharedModule, TabNavService } from '@stratosui/core';
import { CfAutoscalerTestingModule } from '../../cf-autoscaler-testing.module';
import { AutoscalerMetricPageComponent } from './autoscaler-metric-page.component';

describe('AutoscalerMetricPageComponent', () => {
  let component: AutoscalerMetricPageComponent;
  let fixture: ComponentFixture<AutoscalerMetricPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AutoscalerMetricPageComponent,
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
        CurrentUserPermissionsService,

        provideZonelessChangeDetection(),
      ]
    }),
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoscalerMetricPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  afterAll(() => { });
});
