import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardNumberMetricComponent } from './card-number-metric.component';
import { BaseTestModulesNoShared } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('CardNumberMetricComponent', () => {
  let component: CardNumberMetricComponent;
  let fixture: ComponentFixture<CardNumberMetricComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CardNumberMetricComponent],
      imports: [...BaseTestModulesNoShared],
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
