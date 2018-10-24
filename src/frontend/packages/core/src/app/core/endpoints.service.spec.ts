import { CoreModule } from './core.module';
import { TestBed, inject } from '@angular/core/testing';

import { EndpointsService } from './endpoints.service';
import { createBasicStoreModule } from '../test-framework/store-test-helper';
import { UtilsService } from './utils.service';

describe('EndpointsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EndpointsService, UtilsService],
      imports: [
        CoreModule,
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([EndpointsService], (service: EndpointsService) => {
    expect(service).toBeTruthy();
  }));
});
