import { TestBed, inject } from '@angular/core/testing';
import { CsiModeService } from './csi-mode.service';


describe('CsiModeService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CsiModeService]
    });
  });

  it('should be created', inject([CsiModeService], (service: CsiModeService) => {
    expect(service).toBeTruthy();
  }));
});
