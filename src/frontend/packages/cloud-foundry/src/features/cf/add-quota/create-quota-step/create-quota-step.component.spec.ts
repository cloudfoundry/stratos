import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { PaginationMonitorFactory } from '@stratosui/store/monitors/pagination-monitor.factory';
import { CFBaseTestModules } from "@test-framework/cf-test-helper";
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';
import { CreateQuotaStepComponent } from "./create-quota-step.component";
describe('CreateQuotaStepComponent', () => {
  let component: CreateQuotaStepComponent;
  let fixture: ComponentFixture<CreateQuotaStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CreateQuotaStepComponent,
        QuotaDefinitionFormComponent,
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
    fixture = TestBed.createComponent(CreateQuotaStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
