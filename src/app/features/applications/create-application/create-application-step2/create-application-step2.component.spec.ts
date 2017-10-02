import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateApplicationStep2Component } from './create-application-step2.component';

describe('CreateApplicationStep1Component', () => {
  let component: CreateApplicationStep2Component;
  let fixture: ComponentFixture<CreateApplicationStep2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateApplicationStep2Component]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateApplicationStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
