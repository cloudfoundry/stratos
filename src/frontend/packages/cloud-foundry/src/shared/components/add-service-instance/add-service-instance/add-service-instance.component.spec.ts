import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { InternalEventMonitorFactory } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { TabNavService } from '@stratosui/core';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { ServicesService } from '../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../features/service-catalog/services.service.mock';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';
import { CloudFoundryService } from '../../../data-services/cloud-foundry.service';
import { LongRunningCfOperationsService } from '../../../data-services/long-running-cf-op.service';
import { AddServiceInstanceComponent } from './add-service-instance.component';

describe('AddServiceInstanceComponent', () => {
  let component: AddServiceInstanceComponent;
  let fixture: ComponentFixture<AddServiceInstanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AddServiceInstanceComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        { provide: ServicesService, useClass: ServicesServiceMock },
        CfOrgSpaceDataService,
        InternalEventMonitorFactory,
        CloudFoundryService,
        TabNavService,
        LongRunningCfOperationsService,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddServiceInstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
