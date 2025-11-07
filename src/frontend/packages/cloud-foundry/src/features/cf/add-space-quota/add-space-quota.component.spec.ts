import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TabNavService } from '../../../../../core/src/tab-nav.service';
import { CFBaseTestModules } from "@test-framework/cf-test-helper";
import { SpaceQuotaDefinitionFormComponent } from '../space-quota-definition-form/space-quota-definition-form.component';
import { AddSpaceQuotaComponent } from './add-space-quota.component';
import { CreateSpaceQuotaStepComponent } from "./create-space-quota-step/create-space-quota-step.component";
describe('AddSpaceQuotaComponent', () => {
  let component: AddSpaceQuotaComponent;
  let fixture: ComponentFixture<AddSpaceQuotaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AddSpaceQuotaComponent,
        CreateSpaceQuotaStepComponent,
        SpaceQuotaDefinitionFormComponent,
        ...CFBaseTestModules,
      ],
      providers: [
        TabNavService,
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSpaceQuotaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
