import { TestBed, inject } from '@angular/core/testing';

import { ApplicationStateService } from './application-state.service';

describe('ApplicationStateService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApplicationStateService]
    });
  });

  it('should be created', inject([ApplicationStateService], (service: ApplicationStateService) => {
    expect(service).toBeTruthy();
  }));
});
