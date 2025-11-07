import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TabNavService } from '@stratosui/core';
import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '@test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryUserProvidedServicesService } from '@stratosui/shared';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CloudFoundryOrganizationService } from '../services/cloud-foundry-organization.service';
import { EditSpaceStepComponent } from './edit-space-step/edit-space-step.component';
import { EditSpaceComponent } from "./edit-space.component";
describe('EditSpaceComponent', () => {
  let component: EditSpaceComponent;
  let fixture: ComponentFixture<EditSpaceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditSpaceComponent,
        EditSpaceStepComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        
        ActiveRouteCfOrgSpace,
        generateTestCfEndpointServiceProvider(),
        TabNavService,
        CloudFoundryOrganizationService,
        CloudFoundryUserProvidedServicesService,

        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSpaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
