import { TestBed, inject } from '@angular/core/testing';
import { CfRecentAppsListConfig } from '../../../cards/card-cf-recent-apps/card-cf-recent-apps.component';

describe('CfRecentAppsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfRecentAppsListConfig]
    });
  });

  it('should be created', inject([CfRecentAppsListConfig], (service: CfRecentAppsListConfig) => {
    expect(service).toBeTruthy();
  }));
});
