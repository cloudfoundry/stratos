import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TabNavService } from '@stratosui/core';
import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from "@test-framework/cloud-foundry-endpoint-service.helper";
import {
  CliCommandComponent,
  CliInfoComponent,
  CfUserPermissionDirective,
  ApplicationStateService,
  CloudFoundryUserProvidedServicesService,
} from '@stratosui/shared';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { CliInfoCloudFoundryComponent } from "./cli-info-cloud-foundry.component";
describe('CliInfoCloudFoundryComponent', () => {
  let component: CliInfoCloudFoundryComponent;
  let fixture: ComponentFixture<CliInfoCloudFoundryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        CliInfoComponent,
        CliCommandComponent,
        CfUserPermissionDirective,
    ],
      imports: [
        CliInfoCloudFoundryComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        
        generateTestCfEndpointServiceProvider(),
        ActiveRouteCfOrgSpace,
        ApplicationStateService,
        CloudFoundryUserProvidedServicesService,
        TabNavService,

        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CliInfoCloudFoundryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
