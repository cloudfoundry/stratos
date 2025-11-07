import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { generateCfBaseTestModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { ServicesService } from '../../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../../features/service-catalog/services.service.mock';
import { ServiceActionHelperService } from '../../../../data-services/service-action-helper.service';
import { ServiceInstancesListConfigService } from "./service-instances-list-config.service";
describe('ServiceInstancesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        
        ServiceInstancesListConfigService,
        { provide: ServicesService, useClass: ServicesServiceMock },
        DatePipe,
        ServiceActionHelperService,

        provideZonelessChangeDetection(),
      ],
      imports: [
        generateCfBaseTestModules(),
      ]
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(ServiceInstancesListConfigService);
    expect(service).toBeTruthy();
  });
});
