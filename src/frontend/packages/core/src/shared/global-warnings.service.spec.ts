import { TestBed } from '@angular/core/testing';

import { GlobalWarningsService } from './global-warnings.service';

describe('GlobalWarningsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GlobalWarningsService = TestBed.get(GlobalWarningsService);
    expect(service).toBeTruthy();
  });
});
