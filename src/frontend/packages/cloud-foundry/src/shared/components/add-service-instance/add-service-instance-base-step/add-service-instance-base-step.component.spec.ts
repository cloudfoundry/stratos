import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TabNavService } from '../../../../../../core/src/tab-nav.service';
import { generateCfBaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { AddServiceInstanceBaseStepComponent } from './add-service-instance-base-step.component';

describe('AddServiceInstanceBaseStepComponent', () => {
  let component: AddServiceInstanceBaseStepComponent;
  let fixture: ComponentFixture<AddServiceInstanceBaseStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddServiceInstanceBaseStepComponent],
      imports: generateCfBaseTestModules(),
      providers: [TabNavService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddServiceInstanceBaseStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
