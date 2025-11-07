import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { PaginationMonitorFactory } from '@stratosui/store/monitors/pagination-monitor.factory';
import {
  generateCfBaseTestModulesNoShared,
} from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ServicesService } from '../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../features/service-catalog/services.service.mock';
import { SchemaFormComponent } from '../../schema-form/schema-form.component';
import { CsiGuidsService } from '../csi-guids.service';
import { BindAppsStepComponent } from './bind-apps-step.component';
import { TailwindJsonSchemaFormModule } from "../../../../../../core/src/shared/components/tailwind-json-schema-form/tailwind-json-schema-form.module";
describe('BindAppsStepComponent', () => {
  let component: BindAppsStepComponent;
  let fixture: ComponentFixture<BindAppsStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        generateCfBaseTestModulesNoShared(),
        BindAppsStepComponent,
        SchemaFormComponent,
        TailwindJsonSchemaFormModule,
    ],
      providers: [
        
        { provide: ServicesService, useClass: ServicesServiceMock },
        CsiGuidsService,
        PaginationMonitorFactory,

        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BindAppsStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
