import { CommonModule, DatePipe } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../../core/core.module';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { ApplicationServiceMock } from '../../../../../test-framework/application-service-helper';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { SharedModule } from '../../../../shared.module';
import { GithubCommitsListConfigServiceBase } from './github-commits-list-config-base.service';

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
        createBasicStoreModule()
      ]
    });
  });

  it('should be created', inject([GithubCommitsListConfigServiceBase], (service: GithubCommitsListConfigServiceBase) => {
    expect(service).toBeTruthy();
  }));
});
