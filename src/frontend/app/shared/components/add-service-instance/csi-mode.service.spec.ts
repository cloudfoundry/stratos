import { TestBed, inject } from '@angular/core/testing';
import { CsiModeService } from './csi-mode.service';
import { BaseTestModulesNoShared } from '../../../test-framework/cloud-foundry-endpoint-service.helper';


describe('CsiModeService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CsiModeService],
      imports: [...BaseTestModulesNoShared],
    });
  });

  it('should be created', inject([CsiModeService], (service: CsiModeService) => {
    expect(service).toBeTruthy();
  }));
});
