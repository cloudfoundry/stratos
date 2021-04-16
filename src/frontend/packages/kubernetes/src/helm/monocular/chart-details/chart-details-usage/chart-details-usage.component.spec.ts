import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SessionService } from '../../../../../../core/src/shared/services/session.service';

import { EndpointsService } from '../../../../../../core/src/core/endpoints.service';
import { UtilsService } from '../../../../../../core/src/core/utils.service';
import { BaseTestModulesNoShared } from '../../../../../../core/test-framework/core-test.helper';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { ChartDetailsUsageComponent } from './chart-details-usage.component';

describe('Component: ChartDetailsUsage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...BaseTestModulesNoShared],
      declarations: [ChartDetailsUsageComponent],
      providers: [
        EndpointsService,
        UtilsService,
        PaginationMonitorFactory,
        SessionService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create an instance', () => {
    const component = TestBed.createComponent(ChartDetailsUsageComponent);
    expect(component).toBeTruthy();
  });
});
