import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { LongRunningCfOperationsService } from '@stratosui/shared';
import { QuotaDefinitionFormComponent } from '../quota-definition-form/quota-definition-form.component';
import { AddQuotaComponent } from './add-quota.component';
import { CreateQuotaStepComponent } from "./create-quota-step/create-quota-step.component";
describe('AddQuotaComponent', () => {
  let component: AddQuotaComponent;
  let fixture: ComponentFixture<AddQuotaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AddQuotaComponent,
        CreateQuotaStepComponent,
        QuotaDefinitionFormComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        TabNavService, LongRunningCfOperationsService,
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddQuotaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
