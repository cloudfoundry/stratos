import { DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundrySpaceServiceMock } from '../../../../../../test-framework/cloud-foundry-space.service.mock';
import { CloudFoundrySpaceService } from '../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
import { CfSpaceRoutesListConfigService } from './cf-space-routes-list-config.service';

describe('CfSpaceRoutesListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CfSpaceRoutesListConfigService,
        {
          provide: CloudFoundrySpaceService,
          useClass: CloudFoundrySpaceServiceMock
        },
        DatePipe
      ],
      imports: generateCfBaseTestModules(),
    });
  });

  it('should be created', inject([CfSpaceRoutesListConfigService], (service: CfSpaceRoutesListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
