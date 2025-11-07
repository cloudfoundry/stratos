import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from "@test-framework/cloud-foundry-endpoint-service.helper";
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../../shared/services/cloud-foundry-user-provided-services.service';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { EditOrganizationStepComponent } from "./edit-organization-step.component";
describe('EditOrganizationStepComponent', () => {
  let component: EditOrganizationStepComponent;
  let fixture: ComponentFixture<EditOrganizationStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditOrganizationStepComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        ActiveRouteCfOrgSpace, generateTestCfEndpointServiceProvider(), CloudFoundryUserProvidedServicesService,
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditOrganizationStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
