import {  NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { SessionService } from '../../../../../../core/src/shared/services/session.service';

import { EndpointsService } from '../../../../../../core/src/core/endpoints.service';
import { UtilsService } from '../../../../../../core/src/core/utils.service';
import { BaseTestModulesNoShared } from '../../../../../../core/test-framework/core-test.helper';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { HelmReleaseActivatedRouteMock } from '../../../helm-testing.module';
import { ChartDetailsUsageComponent } from './chart-details-usage.component';

describe('Component: ChartDetailsUsage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...BaseTestModulesNoShared, ChartDetailsUsageComponent],
      providers: [
        HelmReleaseActivatedRouteMock,
        EndpointsService,
        UtilsService,
        PaginationMonitorFactory,
        SessionService,

        provideZonelessChangeDetection(),
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create an instance', () => {
    const component = TestBed.createComponent(ChartDetailsUsageComponent);
    expect(component).toBeTruthy();
  });
});
