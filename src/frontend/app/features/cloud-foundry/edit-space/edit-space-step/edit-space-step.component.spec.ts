import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSpaceStepComponent } from './edit-space-step.component';

describe('EditSpaceStepComponent', () => {
  let component: EditSpaceStepComponent;
  let fixture: ComponentFixture<EditSpaceStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditSpaceStepComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSpaceStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
