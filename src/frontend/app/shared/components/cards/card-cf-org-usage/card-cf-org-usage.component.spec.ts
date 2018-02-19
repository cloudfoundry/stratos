import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardCfOrgUsageComponent } from './card-cf-org-usage.component';

describe('CardCfOrgUsageComponent', () => {
  let component: CardCfOrgUsageComponent;
  let fixture: ComponentFixture<CardCfOrgUsageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardCfOrgUsageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCfOrgUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
