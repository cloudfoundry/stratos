import { TestBed, inject } from '@angular/core/testing';

import { CfSpaceRoutesListConfigService } from './cf-space-routes-list-config.service';
import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { CloudFoundrySpaceServiceMock } from '../../../../../test-framework/cloud-foundry-space.service.mock';

describe('CfSpaceRoutesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfSpaceRoutesListConfigService,
        {
          provide: CloudFoundrySpaceService,
          useClass: CloudFoundrySpaceServiceMock
        }
      ],
      imports: [...BaseTestModules],
    });
  });

  it('should be created', inject([CfSpaceRoutesListConfigService], (service: CfSpaceRoutesListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
