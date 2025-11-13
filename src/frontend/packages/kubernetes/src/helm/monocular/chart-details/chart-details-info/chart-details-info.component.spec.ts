import {  NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { MockChartService } from '../../shared/services/chart.service.mock';
import { ChartsService } from '../../shared/services/charts.service';
import { HelmReleaseActivatedRouteMock } from '../../../helm-testing.module';
import { ChartDetailsInfoComponent } from './chart-details-info.component';


describe('Component: ChartDetailsInfo', () => {
  beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ChartDetailsInfoComponent],
        providers: [
          HelmReleaseActivatedRouteMock,
          { provide: ChartsService, useValue: new MockChartService() },

          provideZonelessChangeDetection(),
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();
  });


  it('should create an instance', () => {
    const component = TestBed.createComponent(ChartDetailsInfoComponent);
    expect(component).toBeTruthy();
  });
});
