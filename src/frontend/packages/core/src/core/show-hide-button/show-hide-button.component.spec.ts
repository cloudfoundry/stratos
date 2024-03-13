import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ShowHideButtonComponent } from './show-hide-button.component';

describe('ShowHideButtonComponent', () => {
  let component: ShowHideButtonComponent;
  let fixture: ComponentFixture<ShowHideButtonComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowHideButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowHideButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
