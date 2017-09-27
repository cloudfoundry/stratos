import { TestBed, inject } from '@angular/core/testing';

import { SteppersService } from './steppers.service';

describe('SteppersService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SteppersService]
    });
  });

  it('should be created', inject([SteppersService], (service: SteppersService) => {
    expect(service).toBeTruthy();
  }));
});
