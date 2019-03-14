import { CommonModule } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';

import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';
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
        createBasicStoreModule()
      ],
    });
  });

  it('should be created', inject([EndpointsListConfigService], (service: EndpointsListConfigService) => {
    expect(service).toBeTruthy();
  }));
});
