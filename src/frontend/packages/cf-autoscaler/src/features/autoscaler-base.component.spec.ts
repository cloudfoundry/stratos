import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { createEmptyStoreModule } from "@test-framework/cf-autoscaler-test.helper";

import { ApplicationService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock } from '@stratosui/cloud-foundry/test-framework';
import { CoreModule, SharedModule, TabNavService } from '@stratosui/core';
import { CfAutoscalerTestingModule } from '../cf-autoscaler-testing.module';
import { AutoscalerBaseComponent } from './autoscaler-base.component';

describe('AutoscalerBaseComponent', () => {
  let component: AutoscalerBaseComponent;
  let fixture: ComponentFixture<AutoscalerBaseComponent>;

  beforeEach(() => {
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
        TabNavService,
        provideZonelessChangeDetection(),
      ]
    }),
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoscalerBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
