import { TestBed, inject } from '@angular/core/testing';
import { CfOrgSpaceServiceService } from './cf-org-space-service.service';


describe('EndpointOrgSpaceServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CfOrgSpaceServiceService]
    });
  });

  it('should be created', inject([CfOrgSpaceServiceService], (service: CfOrgSpaceServiceService) => {
    expect(service).toBeTruthy();
  }));
});
