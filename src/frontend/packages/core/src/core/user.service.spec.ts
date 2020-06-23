import { inject, TestBed } from '@angular/core/testing';

import { CoreTestingModule } from '../../test-framework/core-test.modules';
import { createBasicStoreModule } from '@stratosui/store/testing';
import { SharedModule } from '../shared/shared.module';
import { CoreModule } from './core.module';
import { UserService } from './user.service';

describe('UserService', () => {
  beforeEach(() => {

    TestBed.configureTestingModule({
      providers: [UserService],
      imports: [
        CoreModule,
        SharedModule,
        CoreTestingModule,
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([UserService], (service: UserService) => {
    expect(service).toBeTruthy();
  }));
});
