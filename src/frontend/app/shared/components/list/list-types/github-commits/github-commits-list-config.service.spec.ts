import { TestBed, inject } from '@angular/core/testing';

import { GithubCommitsListConfigService } from './github-commits-list-config.service';
import { CommonModule, DatePipe } from '@angular/common';
import { CoreModule } from '../../../../../core/core.module';
import { SharedModule } from '../../../../shared.module';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { ApplicationServiceMock } from '../../../../../test-framework/application-service-helper';

describe('GithubCommitsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        GithubCommitsListConfigService,
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

  it('should be created', inject([GithubCommitsListConfigService], (service: GithubCommitsListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
