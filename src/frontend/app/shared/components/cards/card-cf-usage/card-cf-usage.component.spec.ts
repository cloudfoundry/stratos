import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardCfUsageComponent } from './card-cf-usage.component';

describe('CardCfUsageComponent', () => {
  let component: CardCfUsageComponent;
  let fixture: ComponentFixture<CardCfUsageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardCfUsageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCfUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
