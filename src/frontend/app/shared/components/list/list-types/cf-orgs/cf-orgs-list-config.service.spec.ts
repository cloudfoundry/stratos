import { inject, TestBed } from '@angular/core/testing';

import {
  getBaseTestModules,
  generateTestCfEndpointServiceProvider
} from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgsListConfigService } from './cf-orgs-list-config.service';
import { CloudFoundryEndpointService } from '../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { BaseCF } from '../../../../../features/cloud-foundry/cf-page.types';
import { NgModule } from '@angular/core';

@NgModule({
  providers: [
    BaseCF,
    CfOrgsListConfigService,
  ]
})
class TestModule {
}

describe('CfOrgsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...getBaseTestModules],
      providers: [...generateTestCfEndpointServiceProvider(), BaseCF]

    });
  });

  it('should be created', inject([CfOrgsListConfigService], (service: CfOrgsListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
