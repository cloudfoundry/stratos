import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { CFBaseTestModules } from '../../../../../test-framework/cf-test-helper';
import { SpaceQuotaDefinitionFormComponent } from '../../space-quota-definition-form/space-quota-definition-form.component';
import { CreateSpaceQuotaStepComponent } from './create-space-quota-step.component';

describe('CreateSpaceQuotaStepComponent', () => {
  let component: CreateSpaceQuotaStepComponent;
  let fixture: ComponentFixture<CreateSpaceQuotaStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateSpaceQuotaStepComponent, SpaceQuotaDefinitionFormComponent],
      imports: [...CFBaseTestModules],
      providers: [PaginationMonitorFactory]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateSpaceQuotaStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
