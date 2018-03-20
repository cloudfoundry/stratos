import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardNumberMetricComponent } from './card-number-metric.component';

describe('CardNumberMetricComponent', () => {
  let component: CardNumberMetricComponent;
  let fixture: ComponentFixture<CardNumberMetricComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardNumberMetricComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardNumberMetricComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
