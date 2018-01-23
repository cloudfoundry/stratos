import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeployApplicationStep3Component } from './deploy-application-step3.component';

describe('DeployApplicationStep3Component', () => {
  let component: DeployApplicationStep3Component;
  let fixture: ComponentFixture<DeployApplicationStep3Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeployApplicationStep3Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeployApplicationStep3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
