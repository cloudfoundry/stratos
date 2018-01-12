import { TestBed, inject } from '@angular/core/testing';
import { CfOrgSpaceDataService } from './cf-org-space-service.service';


describe('EndpointOrgSpaceServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfOrgSpaceDataService]
    });
  });

  it('should be created', inject([CfOrgSpaceDataService], (service: CfOrgSpaceDataService) => {
    expect(service).toBeTruthy();
  }));
});
