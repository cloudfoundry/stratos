import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityMonitorFactory } from '@stratosui/store/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '@stratosui/store/monitors/pagination-monitor.factory';
import { generateTestApplicationServiceProvider } from "@test-framework/application-service-helper";
import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ServiceActionHelperService } from '../../../../../../shared/data-services/service-action-helper.service';
import { ApplicationStateService } from '../../../../../../shared/services/application-state.service';
import { ApplicationEnvVarsHelper } from '../build-tab/application-env-vars.service';
import { ServicesTabComponent } from './services-tab.component';
import { EntityServiceFactory } from "@stratosui/store/entity-service-factory.service";
describe('ServicesTabComponent', () => {
  let component: ServicesTabComponent;
  let fixture: ComponentFixture<ServicesTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ServicesTabComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        EntityServiceFactory,
        
        EntityMonitorFactory,
        generateTestApplicationServiceProvider('1', '1'),
        ApplicationEnvVarsHelper,
        ApplicationStateService,
        PaginationMonitorFactory,
        DatePipe,
        ServiceActionHelperService,

        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ServicesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
