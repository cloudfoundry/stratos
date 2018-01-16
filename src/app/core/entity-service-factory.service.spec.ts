import { TestBed, inject } from '@angular/core/testing';

import { EntityServiceFactory } from './entity-service-factory.service';

describe('EntityServiceFactoryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EntityServiceFactory]
    });
  });

  it('should be created', inject([EntityServiceFactory], (service: EntityServiceFactory) => {
    expect(service).toBeTruthy();
  }));
});
