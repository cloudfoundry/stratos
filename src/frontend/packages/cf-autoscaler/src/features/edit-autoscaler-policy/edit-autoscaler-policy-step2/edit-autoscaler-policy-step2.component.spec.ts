import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { createEmptyStoreModule } from "@stratosui/store/testing";
import { ActivatedRoute } from '@angular/router';

import { ApplicationService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock } from '@test-framework/cf';
import { TabNavService } from '@stratosui/core';
import { EntityServiceFactory, EntityMonitorFactory, PaginationMonitorFactory } from '@stratosui/store';
import { CfAutoscalerTestingModule } from '../../../cf-autoscaler-testing.module';
import { EditAutoscalerPolicyService } from '../edit-autoscaler-policy-service';
import { EditAutoscalerPolicyStep2Component } from './edit-autoscaler-policy-step2.component';

describe('EditAutoscalerPolicyStep2Component', () => {
  let component: EditAutoscalerPolicyStep2Component;
  let fixture: ComponentFixture<EditAutoscalerPolicyStep2Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditAutoscalerPolicyStep2Component,
        CfAutoscalerTestingModule,
        NoopAnimationsModule,
        createEmptyStoreModule(),
        RouterTestingModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        DatePipe,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService,
        EntityServiceFactory,
        EntityMonitorFactory,
        PaginationMonitorFactory,
        EditAutoscalerPolicyService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {}
            }
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditAutoscalerPolicyStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
