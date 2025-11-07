import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { testSCFEndpointGuid } from "@test-framework/cloud-foundry-endpoint-service.helper";

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { CF_GUID } from '../../../../../../../../core/src/shared/entity.tokens';
import { SharedModule } from '../../../../../../../../core/src/shared/shared.module';
import { AppStoreModule } from '@stratosui/store/store.module';
import { ApplicationServiceMock } from "@test-framework/application-service-helper";
import {
  generateCfStoreModules,
  generateTestCfEndpointServiceProvider,
} from "@test-framework/cloud-foundry-endpoint-service.helper";
import { CloudFoundrySharedModule } from '../../../../../../shared/cf-shared.module';
import { ApplicationStateService } from '../../../../../../shared/services/application-state.service';
import { ApplicationService } from '../../../../application.service';
import { ApplicationEnvVarsHelper } from '../build-tab/application-env-vars.service';
import { InstancesTabComponent } from "./instances-tab.component";
describe('InstancesTabComponent', () => {
  let component: InstancesTabComponent;
  let fixture: ComponentFixture<InstancesTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InstancesTabComponent,
        ...generateCfStoreModules(),
        CoreModule,
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule,
        CloudFoundrySharedModule,
      ],
      providers: [
        
        generateTestCfEndpointServiceProvider(),
        {
          provide: CF_GUID,
          useValue: testSCFEndpointGuid,
        },
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        AppStoreModule,
        ApplicationStateService,
        ApplicationEnvVarsHelper,

        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InstancesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
