import { TestBed, inject } from '@angular/core/testing';

import { CreateServiceInstanceHelperService } from './create-service-instance-helper.service';
import { BaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CreateServiceInstanceHelperServiceFactory } from './create-service-instance-helper-service-factory.service';

describe('CreateServiceInstanceHelperService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CreateServiceInstanceHelperService, CreateServiceInstanceHelperServiceFactory],
      imports: [...BaseTestModules]
    });
  });

  it('should be created', inject([CreateServiceInstanceHelperService], (service: CreateServiceInstanceHelperService) => {
    expect(service).toBeTruthy();
  }));
});
