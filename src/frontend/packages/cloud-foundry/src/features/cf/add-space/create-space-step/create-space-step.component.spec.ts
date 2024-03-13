import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CreateSpaceStepComponent } from './create-space-step.component';

describe('CreateSpaceStepComponent', () => {
  let component: CreateSpaceStepComponent;
  let fixture: ComponentFixture<CreateSpaceStepComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CreateSpaceStepComponent],
      imports: generateCfBaseTestModules(),
      providers: [ActiveRouteCfOrgSpace]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateSpaceStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
