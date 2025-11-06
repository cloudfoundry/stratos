import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../core/core.module';
import { MetricsRangeSelectorService } from '../../services/metrics-range-selector.service';
import { DateTimeComponent } from '../date-time/date-time.component';
import { StartEndDateComponent } from '../start-end-date/start-end-date.component';
import { MetricsRangeSelectorComponent } from './metrics-range-selector.component';

describe('MetricsRangeSelectorComponent', () => {
  let component: MetricsRangeSelectorComponent;
  let fixture: ComponentFixture<MetricsRangeSelectorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MetricsRangeSelectorComponent,
        CoreModule,
        CoreTestingModule,
        createBasicStoreModule(),
        NoopAnimationsModule
      ],
      providers: [MetricsRangeSelectorService, EntityMonitorFactory]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetricsRangeSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
