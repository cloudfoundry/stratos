import { CommonModule } from '@angular/common';
import { inject, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { createBasicStoreModule } from "../test-framework/core-test.helper";

import { CoreTestingModule } from '../../../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../../../core/core.module';
import { CurrentUserPermissionsService } from '../../../../../core/permissions/current-user-permissions.service';
import { SharedModule } from '../../../../shared.module';
import { EndpointListHelper } from './endpoint-list.helpers';
import { EndpointsListConfigService } from './endpoints-list-config.service';

describe('EndpointsListConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EndpointsListConfigService, EndpointListHelper, CurrentUserPermissionsService,
        provideZonelessChangeDetection()
      ],
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
