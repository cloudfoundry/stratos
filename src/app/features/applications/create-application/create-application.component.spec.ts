import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateApplicationComponent } from './create-application.component';

describe('CreateApplicationComponent', () => {
  let component: CreateApplicationComponent;
  let fixture: ComponentFixture<CreateApplicationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateApplicationComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
