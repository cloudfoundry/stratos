import { TestBed, inject } from '@angular/core/testing';

import { ApplicationEnvVarsService } from './application-env-vars.service';

describe('ApplicationEnvVarsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApplicationEnvVarsService]
    });
  });

  it('should be created', inject([ApplicationEnvVarsService], (service: ApplicationEnvVarsService) => {
    expect(service).toBeTruthy();
  }));
});
