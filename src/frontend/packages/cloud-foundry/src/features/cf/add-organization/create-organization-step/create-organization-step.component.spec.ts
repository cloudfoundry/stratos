import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { PaginationMonitorFactory } from '@stratosui/store/monitors/pagination-monitor.factory';
import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { CreateOrganizationStepComponent } from "./create-organization-step.component";
describe('CreateOrganizationStepComponent', () => {
  let component: CreateOrganizationStepComponent;
  let fixture: ComponentFixture<CreateOrganizationStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CreateOrganizationStepComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        PaginationMonitorFactory,
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateOrganizationStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
