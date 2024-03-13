import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DisplayValueComponent } from './display-value.component';

describe('DisplayValueComponent', () => {
  let component: DisplayValueComponent;
  let fixture: ComponentFixture<DisplayValueComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DisplayValueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
