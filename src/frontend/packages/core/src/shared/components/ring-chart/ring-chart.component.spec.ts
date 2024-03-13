import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RingChartComponent } from './ring-chart.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('RingChartComponent', () => {
  let component: RingChartComponent;
  let fixture: ComponentFixture<RingChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RingChartComponent],
      imports: [
        NoopAnimationsModule,
        NgxChartsModule,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RingChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
