import { ComponentFixture, TestBed } from '@angular/core/testing';
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
      imports: [
        CoreModule,
        NoopAnimationsModule,
        SimpleUsageChartComponent
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleUsageChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
