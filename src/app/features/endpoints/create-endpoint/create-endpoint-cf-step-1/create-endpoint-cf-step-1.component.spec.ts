import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEndpointCfStep1Component } from './create-endpoint-cf-step-1.component';

describe('CreateEndpointCfStep1Component', () => {
  let component: CreateEndpointCfStep1Component;
  let fixture: ComponentFixture<CreateEndpointCfStep1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateEndpointCfStep1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEndpointCfStep1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
