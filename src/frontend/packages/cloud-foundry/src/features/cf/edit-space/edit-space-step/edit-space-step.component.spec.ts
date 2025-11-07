import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from "@test-framework/cloud-foundry-endpoint-service.helper";
import { CloudFoundrySpaceServiceMock } from "@test-framework/cloud-foundry-space.service.mock";
import { CloudFoundrySpaceService } from '../../services/cloud-foundry-space.service';
import { EditSpaceStepComponent } from "./edit-space-step.component";
describe('EditSpaceStepComponent', () => {
  let component: EditSpaceStepComponent;
  let fixture: ComponentFixture<EditSpaceStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditSpaceStepComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },
        generateTestCfEndpointServiceProvider(),

        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSpaceStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
