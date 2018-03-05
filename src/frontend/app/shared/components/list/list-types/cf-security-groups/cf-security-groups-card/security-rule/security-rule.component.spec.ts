import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityRuleComponent } from './security-rule.component';
import { getBaseTestModules, getBaseTestModulesNoShared } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('SecurityRuleComponent', () => {
  let component: SecurityRuleComponent;
  let fixture: ComponentFixture<SecurityRuleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SecurityRuleComponent],
      imports: [...getBaseTestModulesNoShared]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecurityRuleComponent);
    component = fixture.componentInstance;
    component.rule = {
      protocol: 'all',
      destination: '',
      ports: ''

    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
