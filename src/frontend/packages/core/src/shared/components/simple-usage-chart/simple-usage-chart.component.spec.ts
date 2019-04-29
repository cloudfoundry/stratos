import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { CoreModule } from '../../../core/core.module';
import { SimpleUsageChartComponent } from './simple-usage-chart.component';

describe('SimpleUsageChartComponent', () => {
  let component: SimpleUsageChartComponent;
  let fixture: ComponentFixture<SimpleUsageChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, NgxChartsModule, NoopAnimationsModule],
      declarations: [SimpleUsageChartComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleUsageChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
