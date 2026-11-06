import {  NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { Subject } from 'rxjs';

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

  // Regression: versions and the schema arrive from HTTP after the first
  // render. Under zoneless change detection an OnPush view only repaints for
  // signal writes, so plain fields assigned in the subscribes left the
  // versions list empty and the schema notice missing.
  it('renders versions and the schema notice once they arrive', async () => {
    const versions$ = new Subject<any[]>();
    const schema$ = new Subject<unknown>();
    const charts: any = new MockChartService();
    charts.getVersions = () => versions$;
    charts.getChartSchema = () => schema$;
    TestBed.overrideProvider(ChartsService, { useValue: charts });
    const fixture = TestBed.createComponent(ChartDetailsInfoComponent);
    const chart: any = { attributes: { name: 'c', repo: { name: 'r', url: '' }, sources: [], maintainers: [] } };
    const version: any = { attributes: { version: '1.0.0', urls: [] }, relationships: { chart: { data: { name: 'c', repo: { name: 'r' } } } } };
    fixture.componentRef.setInput('chart', chart);
    fixture.componentRef.setInput('currentVersion', version);
    fixture.detectChanges();

    versions$.next([version]);
    schema$.next({ type: 'object' });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('This chart contains a values schema');
    const child = fixture.nativeElement.querySelector('app-chart-details-versions');
    expect(child).not.toBeNull();
    expect(fixture.componentInstance.versions()).toHaveLength(1);
  });
});
