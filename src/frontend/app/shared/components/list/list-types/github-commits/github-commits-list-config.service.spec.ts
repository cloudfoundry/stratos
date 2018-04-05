import { TestBed, inject } from '@angular/core/testing';

import { GithubCommitsListConfigService } from './github-commits-list-config.service';

describe('GithubCommitsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GithubCommitsListConfigService]
    });
  });

  it('should be created', inject([GithubCommitsListConfigService], (service: GithubCommitsListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
