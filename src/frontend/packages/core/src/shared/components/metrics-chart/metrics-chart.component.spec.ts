import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createBasicStoreModule } from "@test-framework/core-test.helper";

import { CoreTestingModule } from "@test-framework/core-test.modules";
import { CoreModule } from '../../../core/core.module';
import { MDAppModule } from '../../../core/md.module';
import { SharedModule } from '../../shared.module';
import { MetricsChartComponent } from './metrics-chart.component';
import { MetricsLineChartConfig } from './metrics-chart.types';

// REASON FOR SKIP: Architectural issue tracked in STRAT-152
//
// PROBLEM:
// MetricsChartComponent (in @stratosui/core) requires a concrete MetricsAction for testing,
// but all implementations are in feature packages (@stratosui/cloud-foundry, @stratosui/kubernetes).
// This violates the dependency hierarchy: core packages should not depend on feature packages.
//
// BLOCKING ISSUE (STRAT-152):
// The metrics architecture needs reorganization to provide test-friendly mock actions:
// - Option A: Create MockMetricsAction in @stratosui/store/testing
// - Option B: Move all metrics actions to store package (major refactoring)
// - Option C: Accept integration-only testing (current state)
//
// CURRENT COVERAGE:
// - Integration tests exist in feature packages (ApplicationInstanceChartComponent, PodMetricsComponent)
// - Component works correctly in production
// - Complex business logic (mapMetricsToChartData, postFetchMiddleware) lacks unit test coverage
//
// DECISION: Keep skipped until STRAT-152 is resolved with architectural decision.
//
// TODO: Fix after metrics architecture has been sorted - STRAT-152
describe.skip('MetricsChartComponent', () => {
  let component: MetricsChartComponent;
  let fixture: ComponentFixture<MetricsChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        MDAppModule,
        CoreModule,
        SharedModule,
        CoreTestingModule,
        createBasicStoreModule(),
        NoopAnimationsModule,
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MetricsChartComponent);
    component = fixture.componentInstance;
    component.chartConfig = new MetricsLineChartConfig();
    component.chartConfig.xAxisLabel = 'Time';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
