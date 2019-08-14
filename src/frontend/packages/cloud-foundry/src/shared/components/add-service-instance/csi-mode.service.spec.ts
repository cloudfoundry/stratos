import { inject, TestBed } from '@angular/core/testing';

import { generateCfBaseTestModulesNoShared } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CsiModeService } from './csi-mode.service';

describe('CsiModeService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CsiModeService],
      imports: generateCfBaseTestModulesNoShared(),
    });
  });

  it('should be created', inject([CsiModeService], (service: CsiModeService) => {
    expect(service).toBeTruthy();
  }));
});
