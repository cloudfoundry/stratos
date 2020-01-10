import { CommonModule } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';

import { CoreTestingModule } from '../../../../../../test-framework/core-test.modules';
import { createBasicStoreModule } from '@stratos/store/testing';
import { CoreModule } from '../../../../../core/core.module';
import { SharedModule } from '../../../../shared.module';
import { EndpointListHelper } from './endpoint-list.helpers';
import { EndpointsListConfigService } from './endpoints-list-config.service';

describe('EndpointsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EndpointsListConfigService, EndpointListHelper],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        CoreTestingModule,
        createBasicStoreModule()
      ],
    });
  });

  it('should be created', inject([EndpointsListConfigService], (service: EndpointsListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
