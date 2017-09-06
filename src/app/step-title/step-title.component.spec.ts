import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StepTitleComponent } from './step-title.component';

describe('StepTitleComponent', () => {
  let component: StepTitleComponent;
  let fixture: ComponentFixture<StepTitleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StepTitleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StepTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
