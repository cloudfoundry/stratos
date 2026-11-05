import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BaseChartDirective } from 'ng2-charts';

import { CoreModule } from '../../../core/core.module';
import { SimpleUsageChartComponent } from './simple-usage-chart.component';

describe('SimpleUsageChartComponent', () => {
  let component: SimpleUsageChartComponent;
  let fixture: ComponentFixture<SimpleUsageChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        CoreModule,
        NoopAnimationsModule,
        SimpleUsageChartComponent,
      ]
    });
    // The test DOM has no canvas to draw on, so chart.js throws when the data
    // changes. Leave the chart directive out; the counts beside it still render.
    TestBed.overrideComponent(SimpleUsageChartComponent, {
      remove: { imports: [BaseChartDirective] },
      add: { schemas: [NO_ERRORS_SCHEMA] },
    });
    TestBed.compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(SimpleUsageChartComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the used and total counts, and keeps them when the data goes away', async () => {
    const counts = () => fixture.nativeElement.querySelector('.simple-graph__counts').textContent.replace(/\s+/g, '');
    expect(counts()).toBe('-');

    fixture.componentRef.setInput('data', { total: 10, used: 4 });
    await fixture.whenStable();
    expect(counts()).toBe('4/10');

    fixture.componentRef.setInput('data', undefined);
    await fixture.whenStable();
    expect(counts()).toBe('4/10');
  });
});
