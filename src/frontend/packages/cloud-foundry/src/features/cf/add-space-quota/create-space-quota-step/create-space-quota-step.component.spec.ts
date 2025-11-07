import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { PaginationMonitorFactory } from '@stratosui/store/monitors/pagination-monitor.factory';
import { CFBaseTestModules } from "@test-framework/cf-test-helper";
import { SpaceQuotaDefinitionFormComponent } from '../../space-quota-definition-form/space-quota-definition-form.component';
import { CreateSpaceQuotaStepComponent } from "./create-space-quota-step.component";
describe('CreateSpaceQuotaStepComponent', () => {
  let component: CreateSpaceQuotaStepComponent;
  let fixture: ComponentFixture<CreateSpaceQuotaStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CreateSpaceQuotaStepComponent,
        SpaceQuotaDefinitionFormComponent,
        ...CFBaseTestModules,
      ],
      providers: [
        PaginationMonitorFactory,
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateSpaceQuotaStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
