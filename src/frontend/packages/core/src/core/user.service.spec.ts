import { TestBed, inject } from '@angular/core/testing';

import { UserService } from './user.service';
import { CoreModule } from './core.module';
import { SharedModule } from '../shared/shared.module';
import { createBasicStoreModule } from '../test-framework/store-test-helper';

describe('UserService', () => {
  beforeEach(() => {

    TestBed.configureTestingModule({
      providers: [UserService],
      imports: [
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([UserService], (service: UserService) => {
    expect(service).toBeTruthy();
  }));
});
