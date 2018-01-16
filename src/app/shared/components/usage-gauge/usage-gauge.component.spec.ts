import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UsageGaugeComponent } from './usage-gauge.component';

describe('UsageGaugeComponent', () => {
  let component: UsageGaugeComponent;
  let fixture: ComponentFixture<UsageGaugeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UsageGaugeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UsageGaugeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
