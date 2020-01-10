import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { PaginationMonitorFactory } from '../../../../../../../store/src/monitors/pagination-monitor.factory';
import { BaseTestModulesNoShared } from '../../../../../../test-framework/core-test.helper';
import { EndpointsService } from '../../../../../core/endpoints.service';
import { UtilsService } from '../../../../../core/utils.service';
import { ChartDetailsUsageComponent } from './chart-details-usage.component';

describe('Component: ChartDetailsUsage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...BaseTestModulesNoShared],
      declarations: [ChartDetailsUsageComponent],
      providers: [
        EndpointsService,
        UtilsService,
        PaginationMonitorFactory
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create an instance', () => {
    const component = TestBed.createComponent(ChartDetailsUsageComponent);
    expect(component).toBeTruthy();
  });
});
