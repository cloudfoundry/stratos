import { DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';

import { ServicesService } from '../../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../../features/service-catalog/services.service.mock';
import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { ServiceInstancesListConfigService } from './service-instances-list-config.service';

describe('ServiceInstancesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ServiceInstancesListConfigService,
        { provide: ServicesService, useClass: ServicesServiceMock },
        DatePipe],
      imports: [
        BaseTestModules,
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([ServiceInstancesListConfigService], (service: ServiceInstancesListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
