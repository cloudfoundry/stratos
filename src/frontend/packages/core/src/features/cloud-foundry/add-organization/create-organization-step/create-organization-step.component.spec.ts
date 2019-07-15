import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { CreateOrganizationStepComponent } from './create-organization-step.component';

describe('CreateOrganizationStepComponent', () => {
  let component: CreateOrganizationStepComponent;
  let fixture: ComponentFixture<CreateOrganizationStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateOrganizationStepComponent],
      imports: [...BaseTestModules],
      providers: [PaginationMonitorFactory]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateOrganizationStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
