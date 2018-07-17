import { CfUserService } from '../shared/data-services/cf-user.service';
import { ConnectionBackend, Http } from '@angular/http';
import { MockBackend } from '@angular/http/testing';

export const CfUserServiceTestProvider = [
    CfUserService,
    {
      provide: ConnectionBackend,
      useClass: MockBackend
     },
     Http
];
