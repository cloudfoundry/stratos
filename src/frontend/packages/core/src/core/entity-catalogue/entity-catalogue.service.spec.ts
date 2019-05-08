import { TestBed } from '@angular/core/testing';

import { EntityCatalogueService } from './entity-catalogue.service';

describe('EntityCatalogueService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: EntityCatalogueService = TestBed.get(EntityCatalogueService);
    expect(service).toBeTruthy();
  });
});
