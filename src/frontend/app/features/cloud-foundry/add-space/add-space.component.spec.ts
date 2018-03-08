import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSpaceComponent } from './add-space.component';
import { getBaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CreateSpaceStepComponent } from './create-space-step/create-space-step.component';

describe('AddSpaceComponent', () => {
  let component: AddSpaceComponent;
  let fixture: ComponentFixture<AddSpaceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddSpaceComponent, CreateSpaceStepComponent],
      imports: [...getBaseTestModules]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSpaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
