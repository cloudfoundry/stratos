import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { BaseTestModulesNoShared } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ChartDetailsUsageComponent } from './chart-details-usage.component';

describe('Component: ChartDetailsUsage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...BaseTestModulesNoShared],
      declarations: [ChartDetailsUsageComponent],
      providers: [

      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create an instance', () => {
    const component = TestBed.createComponent(ChartDetailsUsageComponent);
    expect(component).toBeTruthy();
  });
});
