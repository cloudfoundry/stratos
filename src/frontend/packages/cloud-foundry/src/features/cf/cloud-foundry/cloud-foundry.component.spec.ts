import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { populateStoreWithTestEndpoint, generateCfBaseTestModules, generateTestCfServiceProvider } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { TabNavService } from '@stratosui/core';
import { PaginationMonitorFactory } from '@stratosui/store/monitors/pagination-monitor.factory';
import { CfEndpointsMissingComponent } from '@stratosui/shared/components/cf-endpoints-missing/cf-endpoints-missing.component';
import { CloudFoundryComponent } from "./cloud-foundry.component";
describe('CloudFoundryComponent', () => {
  let component: CloudFoundryComponent;
  let fixture: ComponentFixture<CloudFoundryComponent>;

  beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [
        CloudFoundryComponent,
        CfEndpointsMissingComponent,
        ...generateCfBaseTestModules(),
      ],
        providers: [
          
          PaginationMonitorFactory,
          generateTestCfServiceProvider(),
          TabNavService,

          provideZonelessChangeDetection(),
        ]
      }).compileComponents();

      populateStoreWithTestEndpoint();
    });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
