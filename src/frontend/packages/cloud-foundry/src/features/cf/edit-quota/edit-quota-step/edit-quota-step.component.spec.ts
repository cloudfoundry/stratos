import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';

import { PaginationMonitorFactory } from '@stratosui/store/monitors/pagination-monitor.factory';
import { CFBaseTestModules } from "@test-framework/cf-test-helper";
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';
import { EditQuotaStepComponent } from "./edit-quota-step.component";
describe('EditQuotaStepComponent', () => {
  let component: EditQuotaStepComponent;
  let fixture: ComponentFixture<EditQuotaStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditQuotaStepComponent,
        QuotaDefinitionFormComponent,
        QuotaDefinitionFormComponent,
        ...CFBaseTestModules,
      ],
      providers: [
        PaginationMonitorFactory, {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                quotaId: 'quotaId',
                cfId: 'cfGuid'
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
    fixture = TestBed.createComponent(EditQuotaStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
