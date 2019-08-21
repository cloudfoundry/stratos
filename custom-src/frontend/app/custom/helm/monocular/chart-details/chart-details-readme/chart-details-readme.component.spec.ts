import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ChartsService } from '../../shared/services/charts.service';
import { ChartDetailsReadmeComponent } from './chart-details-readme.component';
import { MockChartService } from '../../shared/services/chart.service.mock';

describe('Component: ChartDetailsReadme', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [ChartDetailsReadmeComponent],
      providers: [
        { provide: ChartsService, useValue: new MockChartService()},
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create an instance', () => {
    const component = TestBed.createComponent(ChartDetailsReadmeComponent);
    expect(component).toBeTruthy();
  });
});
