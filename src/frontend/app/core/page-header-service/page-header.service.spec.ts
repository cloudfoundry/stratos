import { TestBed, inject } from '@angular/core/testing';

import { PageHeaderService } from './page-header.service';

describe('PageHeaderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PageHeaderService]
    });
  });

  it('should be created', inject([PageHeaderService], (service: PageHeaderService) => {
    expect(service).toBeTruthy();
  }));
});
