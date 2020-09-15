import { HttpClientModule } from '@angular/common/http';
import { inject, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { SharedModule } from '../../../../../../core/src/shared/shared.module';
import { generateCfStoreModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { CloudFoundrySectionModule } from '../../cloud-foundry-section.module';
import { CfRolesService } from './cf-roles.service';

describe('CfRolesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...generateCfStoreModules(),
        SharedModule,
        CloudFoundrySectionModule,
        HttpClientModule,
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
