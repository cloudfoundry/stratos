import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationInstanceMemoryChartComponent } from './application-instance-memory-chart.component';

describe('ApplicationInstanceMemoryChartComponent', () => {
  let component: ApplicationInstanceMemoryChartComponent;
  let fixture: ComponentFixture<ApplicationInstanceMemoryChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ApplicationInstanceMemoryChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationInstanceMemoryChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
