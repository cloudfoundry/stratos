import { HttpBackend, HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';

import { CfUserService } from '../src/shared/data-services/cf-user.service';
import { cfCurrentUserPermissionsService } from '../src/user-permissions/cf-user-permissions-checkers';


export const CfUserServiceTestProvider = [
  CfUserService,
  {
    provide: HttpBackend,
    useClass: HttpTestingController
  },
  ...cfCurrentUserPermissionsService
];
