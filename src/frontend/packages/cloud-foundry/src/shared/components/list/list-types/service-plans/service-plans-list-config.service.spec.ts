import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { generateCfBaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServicesService } from '../../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../../features/service-catalog/services.service.mock';
import { ServicePlansListConfigService } from './service-plans-list-config.service';

describe('ServicePlansListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        
        ServicePlansListConfigService,
        DatePipe,
        { provide: ServicesService, useClass: ServicesServiceMock }
      ,
        provideZonelessChangeDetection()
      ],
      imports: generateCfBaseTestModules(),
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(ServicePlansListConfigService);
    expect(service).toBeTruthy();
  });
});
