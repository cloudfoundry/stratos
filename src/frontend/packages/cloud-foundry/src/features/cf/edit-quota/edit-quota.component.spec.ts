import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';

import { TabNavService } from '../../../../../core/src/tab-nav.service';
import { CFBaseTestModules } from "@test-framework/cf-test-helper";
import { QuotaDefinitionFormComponent } from '../quota-definition-form/quota-definition-form.component';
import { EditQuotaStepComponent } from './edit-quota-step/edit-quota-step.component';
import { EditQuotaComponent } from "./edit-quota.component";
describe('EditQuotaComponent', () => {
  let component: EditQuotaComponent;
  let fixture: ComponentFixture<EditQuotaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditQuotaComponent,
        EditQuotaStepComponent,
        QuotaDefinitionFormComponent,
        ...CFBaseTestModules,
      ],
      providers: [
        TabNavService, {
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
    fixture = TestBed.createComponent(EditQuotaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
