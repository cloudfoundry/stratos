import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BaseTestModulesNoShared } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ChartDetailsUsageComponent } from './chart-details-usage.component';
import { EndpointsService } from '../../../../../core/endpoints.service';
import { UtilsService } from '../../../../../core/utils.service';
import { PaginationMonitorFactory } from '../../../../../shared/monitors/pagination-monitor.factory';

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
