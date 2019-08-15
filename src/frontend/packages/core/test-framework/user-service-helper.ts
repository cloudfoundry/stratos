import { ConnectionBackend, Http } from '@angular/http';
import { MockBackend } from '@angular/http/testing';

import { CfUserService } from '../../cloud-foundry/src/shared/data-services/cf-user.service';


export const CfUserServiceTestProvider = [
  CfUserService,
  {
    provide: ConnectionBackend,
    useClass: MockBackend
  },
  Http
];
