import { HttpBackend } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';

import { cfCurrentUserPermissionsService } from '../src/user-permissions/cf-user-permissions-checkers';


// Legacy-named bundle: provides the test HttpBackend + CF permissions (the CfUserService it once provided was deleted).
export const CfUserServiceTestProvider = [
  {
    provide: HttpBackend,
    useClass: HttpTestingController
  },
  ...cfCurrentUserPermissionsService
];
