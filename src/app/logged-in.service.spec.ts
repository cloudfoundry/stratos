import { TestBed, inject } from '@angular/core/testing';

import { LoggedInService } from './logged-in.service';

describe('LoggedInService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggedInService]
    });
  });

  it('should be created', inject([LoggedInService], (service: LoggedInService) => {
    expect(service).toBeTruthy();
  }));
});
