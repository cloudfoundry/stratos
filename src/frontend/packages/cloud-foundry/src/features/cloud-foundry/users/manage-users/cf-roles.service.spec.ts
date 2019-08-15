import { inject, TestBed } from '@angular/core/testing';
import { HttpModule } from '@angular/http';
import { RouterTestingModule } from '@angular/router/testing';

import { CustomImportModule } from '../../../../../../core/src/custom-import.module';
import { SharedModule } from '../../../../../../core/src/shared/shared.module';
import { createBasicStoreModule } from '../../../../../../core/test-framework/store-test-helper';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
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
    }).overrideModule(CloudFoundryModule, {
      remove: {
        imports: [CustomImportModule]
      }
    });
  });

  it('should be created', inject([CfRolesService], (service: CfRolesService) => {
    expect(service).toBeTruthy();
  }));
});
