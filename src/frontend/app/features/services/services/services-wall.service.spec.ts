import { TestBed, inject } from '@angular/core/testing';

import { ServicesWallService } from './services-wall.service';

describe('ServicesWallService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ServicesWallService]
    });
  });

  it('should be created', inject([ServicesWallService], (service: ServicesWallService) => {
    expect(service).toBeTruthy();
  }));
});
