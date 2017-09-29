import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateApplicationStep3Component } from './create-application-step3.component';

describe('CreateApplicationStep1Component', () => {
  let component: CreateApplicationStep3Component;
  let fixture: ComponentFixture<CreateApplicationStep3Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateApplicationStep3Component]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateApplicationStep3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
