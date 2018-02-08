import { TestBed, inject } from '@angular/core/testing';

import { CloudFoundryService } from './cloud-foundry.service';

describe('CloudFoundryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CloudFoundryService]
    });
  });

  it('should be created', inject([CloudFoundryService], (service: CloudFoundryService) => {
    expect(service).toBeTruthy();
  }));
});
