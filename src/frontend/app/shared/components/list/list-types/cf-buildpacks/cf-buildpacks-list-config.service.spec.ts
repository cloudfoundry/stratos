import { TestBed, inject } from '@angular/core/testing';

import { CfBuildpacksListConfigService } from './cf-buildpacks-list-config.service';

describe('CfBuildpacksListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfBuildpacksListConfigService]
    });
  });

  it('should be created', inject([CfBuildpacksListConfigService], (service: CfBuildpacksListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
