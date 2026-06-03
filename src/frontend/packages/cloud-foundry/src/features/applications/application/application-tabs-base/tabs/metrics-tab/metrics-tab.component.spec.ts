import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, Component, input } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsChartComponent, MetricsParentRangeSelectorComponent } from '@stratosui/core';
import { MetricsTabComponent } from './metrics-tab.component';
import { ApplicationService } from '@stratosui/cloud-foundry';

// Mock components for testing
@Component({
  selector: 'app-metrics-chart',
  template: '',
  standalone: true
})
class MockMetricsChartComponent {
  metricsConfig = input<any>();
  chartConfig = input<any>();
}

@Component({
  selector: 'app-metrics-parent-range-selector',
  template: '<ng-content></ng-content>',
  standalone: true
})
class MockMetricsParentRangeSelectorComponent {}

describe('MetricsTabComponent', () => {
  let component: MetricsTabComponent;
  let fixture: ComponentFixture<MetricsTabComponent>;
  const appId = '1';
  const cfId = '2';

  beforeEach(async () => {
    const mockApplicationService = {
      appGuid: appId,
      cfGuid: cfId,
    };

    const mockEntityMonitorFactory = {
      create: () => ({
        entity$: { pipe: () => ({ subscribe: () => ({}) }) },
        entityRequest$: { pipe: () => ({ subscribe: () => ({}) }) }
      })
    };

    await TestBed.configureTestingModule({
      imports: [MetricsTabComponent],
      providers: [
        { provide: ApplicationService, useValue: mockApplicationService },
        provideZonelessChangeDetection(),
      ]
    })
    .overrideComponent(MetricsTabComponent, {
      remove: {
        imports: [MetricsChartComponent, MetricsParentRangeSelectorComponent]
      },
      add: {
        imports: [MockMetricsChartComponent, MockMetricsParentRangeSelectorComponent]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetricsTabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
