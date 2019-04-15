import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ConfigService } from '../shared/services/config.service';
import { ChartItemComponent } from './chart-item.component';


describe('Component: ChartItem', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [ChartItemComponent],
      providers: [ConfigService],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create an instance', () => {
    const component = TestBed.createComponent(ChartItemComponent);
    expect(component).toBeTruthy();
  });
});
