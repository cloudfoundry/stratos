import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEndpointBaseStepComponent } from './create-endpoint-base-step.component';

describe('CreateEndpointBaseStepComponent', () => {
  let component: CreateEndpointBaseStepComponent;
  let fixture: ComponentFixture<CreateEndpointBaseStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateEndpointBaseStepComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEndpointBaseStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
