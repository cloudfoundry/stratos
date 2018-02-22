import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardCfSpaceUsageComponent } from './card-cf-space-usage.component';

describe('CardCfSpaceUsageComponent', () => {
  let component: CardCfSpaceUsageComponent;
  let fixture: ComponentFixture<CardCfSpaceUsageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardCfSpaceUsageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCfSpaceUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
