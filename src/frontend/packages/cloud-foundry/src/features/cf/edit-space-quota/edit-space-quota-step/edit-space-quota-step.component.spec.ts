import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';

import { PaginationMonitorFactory } from '@stratosui/store/monitors/pagination-monitor.factory';
import { CFBaseTestModules } from "@test-framework/cf-test-helper";
import { SpaceQuotaDefinitionFormComponent } from '../../space-quota-definition-form/space-quota-definition-form.component';
import { EditSpaceQuotaStepComponent } from "./edit-space-quota-step.component";
describe('EditSpaceQuotaStepComponent', () => {
  let component: EditSpaceQuotaStepComponent;
  let fixture: ComponentFixture<EditSpaceQuotaStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditSpaceQuotaStepComponent,
        SpaceQuotaDefinitionFormComponent,
        ...CFBaseTestModules,
      ],
      providers: [
        PaginationMonitorFactory, {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                quotaId: 'quotaId',
                endpointId: 'endpointId'
              },
              queryParams: {}
            },
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSpaceQuotaStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
