import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MonocularChartCardComponent } from './monocular-chart-card.component';

describe('MonocularChartCardComponent', () => {
  let component: MonocularChartCardComponent;
  let fixture: ComponentFixture<MonocularChartCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonocularChartCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonocularChartCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
