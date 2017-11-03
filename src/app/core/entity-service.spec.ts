import { TestBed, inject } from '@angular/core/testing';

import { EntityService } from './entity-service';

describe('EntityServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EntityService]
    });
  });

  it('should be created', inject([EntityService], (service: EntityService) => {
    expect(service).toBeTruthy();
  }));
});
