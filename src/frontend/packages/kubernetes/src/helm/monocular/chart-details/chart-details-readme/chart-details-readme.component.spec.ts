import {  NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { Subject } from 'rxjs';

import { MockChartService } from '../../shared/services/chart.service.mock';
import { ChartsService } from '../../shared/services/charts.service';
import { ChartDetailsReadmeComponent } from './chart-details-readme.component';

describe('Component: ChartDetailsReadme', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChartDetailsReadmeComponent],
      providers: [
        
        { provide: ChartsService, useValue: new MockChartService() },

        provideZonelessChangeDetection(),
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create an instance', () => {
    const component = TestBed.createComponent(ChartDetailsReadmeComponent);
    expect(component).toBeTruthy();
  });
  it('shows the spinner while the readme loads, then the readme', async () => {
    const readme = new Subject<string>();
    vi.spyOn(TestBed.inject(ChartsService), 'getChartReadme').mockReturnValue(readme as any);
    const fixture = TestBed.createComponent(ChartDetailsReadmeComponent);
    fixture.componentRef.setInput('currentVersion', { id: 'v1' });
    await new Promise(resolve => setTimeout(resolve, 150));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-busy')).not.toBeNull();

    readme.next('# Hello');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-busy')).toBeNull();
    expect(fixture.nativeElement.querySelector('.markdown-body h1')?.textContent).toBe('Hello');
  });
});
