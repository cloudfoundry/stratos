import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BaseChartDirective } from 'ng2-charts';

import { CoreModule } from '../../../core/core.module';
import { SimpleUsageChartComponent } from './simple-usage-chart.component';

describe('SimpleUsageChartComponent', () => {
  let component: SimpleUsageChartComponent;
  let fixture: ComponentFixture<SimpleUsageChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, BaseChartDirective, NoopAnimationsModule],
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
