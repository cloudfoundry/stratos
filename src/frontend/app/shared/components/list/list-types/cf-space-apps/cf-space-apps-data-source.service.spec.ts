import { TestBed, inject } from '@angular/core/testing';

import { CfSpaceAppsDataSourceService } from './cf-space-apps-data-source.service';

describe('CfSpaceAppsDataSourceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfSpaceAppsDataSourceService]
    });
  });

  it('should be created', inject([CfSpaceAppsDataSourceService], (service: CfSpaceAppsDataSourceService) => {
    expect(service).toBeTruthy();
  }));
});
