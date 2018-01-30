import { TestBed, inject } from '@angular/core/testing';

import { LoggedInService } from './logged-in.service';
import { StoreModule } from '@ngrx/store';
import { CoreModule } from './core/core.module';
import { createBasicStoreModule } from './test-framework/store-test-helper';

describe('LoggedInService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggedInService],
      imports: [
        CoreModule,
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([LoggedInService], (service: LoggedInService) => {
    expect(service).toBeTruthy();
  }));
});
