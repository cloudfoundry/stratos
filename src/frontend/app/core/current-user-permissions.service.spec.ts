import { TestBed, inject } from '@angular/core/testing';

import { CurrentUserPermissionsService } from './current-user-permissions.service';

describe('CurrentUserPermissionsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CurrentUserPermissionsService]
    });
  });

  it('should be created', inject([CurrentUserPermissionsService], (service: CurrentUserPermissionsService) => {
    expect(service).toBeTruthy();
  }));
});
