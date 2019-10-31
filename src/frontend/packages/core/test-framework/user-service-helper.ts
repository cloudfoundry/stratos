import { CfUserService } from '../../cloud-foundry/src/shared/data-services/cf-user.service';
import { HttpBackend } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from 'selenium-webdriver/http';


export const CfUserServiceTestProvider = [
  CfUserService,
  {
    provide: HttpBackend,
    useClass: HttpTestingController
  },
  HttpClient
];
