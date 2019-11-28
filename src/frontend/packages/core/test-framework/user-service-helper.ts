import { HttpBackend, HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';

import { CfUserService } from '../../cloud-foundry/src/shared/data-services/cf-user.service';


export const CfUserServiceTestProvider = [
  CfUserService,
  {
    provide: HttpBackend,
    useClass: HttpTestingController
  },
  HttpClient
];
