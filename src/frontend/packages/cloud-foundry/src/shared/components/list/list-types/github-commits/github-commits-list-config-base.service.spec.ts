import { CommonModule, DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';

import { ApplicationService } from '../../../../../../../cloud-foundry/src/features/applications/application.service';
import { CoreModule } from '../../../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../../../core/src/shared/shared.module';
import { ApplicationServiceMock } from '../../../../../../../core/test-framework/application-service-helper';
import { CoreTestingModule } from '../../../../../../../core/test-framework/core-test.modules';
import { createBasicStoreModule } from '../../../../../../../store/testing/public-api';
import { GithubCommitsListConfigServiceBase } from './github-commits-list-config-base.service';

// TODO: Move this file to cf package - #3769
describe('GithubCommitsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        GithubCommitsListConfigServiceBase,
        DatePipe
      ],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        CoreTestingModule,
        createBasicStoreModule()
      ]
    });
  });

  it('should be created', inject([GithubCommitsListConfigServiceBase], (service: GithubCommitsListConfigServiceBase) => {
    expect(service).toBeTruthy();
  }));
});
