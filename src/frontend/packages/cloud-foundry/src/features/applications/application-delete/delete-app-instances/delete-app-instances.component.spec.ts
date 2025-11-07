import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { generateTestApplicationServiceProvider } from "@test-framework/application-service-helper";
import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ServiceActionHelperService } from '../../../../shared/data-services/service-action-helper.service';
import {
  ApplicationEnvVarsHelper,
} from '../../application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { ApplicationStateService } from './../../../../shared/services/application-state.service';
import { DeleteAppServiceInstancesComponent } from './delete-app-instances.component';

describe('DeleteAppInstancesComponent', () => {
  let component: DeleteAppServiceInstancesComponent;
  let fixture: ComponentFixture<DeleteAppServiceInstancesComponent>;
  const appId = '1';
  const cfId = '2';
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DeleteAppServiceInstancesComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationEnvVarsHelper,
        DatePipe,
        ServiceActionHelperService,
        ApplicationStateService,

        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteAppServiceInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
