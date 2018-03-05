import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityRuleComponent } from './security-rule.component';

describe('SecurityRuleComponent', () => {
  let component: SecurityRuleComponent;
  let fixture: ComponentFixture<SecurityRuleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SecurityRuleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecurityRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
