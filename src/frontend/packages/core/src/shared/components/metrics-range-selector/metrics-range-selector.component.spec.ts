import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { CoreModule } from '../../../core/core.module';
import { EntityMonitorFactory } from '../../monitors/entity-monitor.factory.service';
import { MetricsRangeSelectorService } from '../../services/metrics-range-selector.service';
import { DateTimeComponent } from '../date-time/date-time.component';
import { StartEndDateComponent } from '../start-end-date/start-end-date.component';
import { MetricsRangeSelectorComponent } from './metrics-range-selector.component';

describe('MetricsRangeSelectorComponent', () => {
  let component: MetricsRangeSelectorComponent;
  let fixture: ComponentFixture<MetricsRangeSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MetricsRangeSelectorComponent, StartEndDateComponent, DateTimeComponent],
      imports: [
        CoreModule,
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
