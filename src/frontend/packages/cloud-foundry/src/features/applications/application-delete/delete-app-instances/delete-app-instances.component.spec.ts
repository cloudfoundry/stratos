import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateTestApplicationServiceProvider, generateCfBaseTestModulesNoShared, ApplicationStateService, ApplicationEnvVarsHelper } from '@test-framework/cf';
import { ServiceActionHelperService } from '../../../../shared/data-services/service-action-helper.service';
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
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        DatePipe,
        ServiceActionHelperService,
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
