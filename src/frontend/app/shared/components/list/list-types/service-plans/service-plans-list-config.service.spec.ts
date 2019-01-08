import { DatePipe } from '@angular/common';
import { async, inject, TestBed } from '@angular/core/testing';

import { ServicesService } from '../../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../../features/service-catalog/services.service.mock';
import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { ServicePlansListConfigService } from './service-plans-list-config.service';

describe('ServicePlansListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ServicePlansListConfigService,
        DatePipe,
        { provide: ServicesService, useClass: ServicesServiceMock }
      ],
      imports: [
        BaseTestModules,
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', async(inject([ServicePlansListConfigService], (service: ServicePlansListConfigService) => {
    expect(service).toBeTruthy();
  })));
});
