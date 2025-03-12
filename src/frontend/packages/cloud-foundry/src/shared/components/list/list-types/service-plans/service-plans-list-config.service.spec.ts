import { DatePipe } from '@angular/common';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';

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
      ],
      imports: generateCfBaseTestModules(),
    });
  });

  it('should be created', waitForAsync(inject([ServicePlansListConfigService], (service: ServicePlansListConfigService) => {
    expect(service).toBeTruthy();
  })));
});
