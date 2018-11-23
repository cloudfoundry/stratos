import { inject, TestBed } from '@angular/core/testing';
import { HttpModule } from '@angular/http';
import { RouterTestingModule } from '@angular/router/testing';

import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { SharedModule } from '../../../../shared/shared.module';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { CloudFoundryModule } from '../../cloud-foundry.module';
import { CfRolesService } from './cf-roles.service';


describe('CfRolesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        SharedModule,
        CloudFoundryModule,
        HttpModule,
        RouterTestingModule
      ],
      providers: [
        CfRolesService,
        CfUserService,
      ]
    });
  });

  it('should be created', inject([CfRolesService], (service: CfRolesService) => {
    expect(service).toBeTruthy();
  }));
});
