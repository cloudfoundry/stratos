import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ChartsService } from '../../shared/services/charts.service';
import { ChartDetailsReadmeComponent } from './chart-details-readme.component';


describe('Component: ChartDetailsReadme', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [ChartDetailsReadmeComponent],
      providers: [{ provide: ChartsService }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create an instance', () => {
    const component = TestBed.createComponent(ChartDetailsReadmeComponent);
    expect(component).toBeTruthy();
  });
});
