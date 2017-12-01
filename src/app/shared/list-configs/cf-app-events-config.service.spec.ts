import { TestBed, inject } from '@angular/core/testing';

import { CfAppEventsConfigService } from './cf-app-events-config.service';

describe('CfAppEventsConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfAppEventsConfigService]
    });
  });

  it('should be created', inject([CfAppEventsConfigService], (service: CfAppEventsConfigService) => {
    expect(service).toBeTruthy();
  }));
});
