import { FocusDirective } from './focus.directive';
import { inject, TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

@Component({
  template: `<input type="text" autoFocus>`
})
class TestAutoFocusComponent {
}

describe('FocusDirective', () => {

  let component: TestAutoFocusComponent;
  let fixture: ComponentFixture<TestAutoFocusComponent>;
  let inputEl: DebugElement;
  let focusDirective: FocusDirective;

  beforeEach(() => {
    // { provide: ElementRef, useClass: MockElementRef }
    TestBed.configureTestingModule({
      providers: [
      ],
      declarations: [
        TestAutoFocusComponent,
        FocusDirective,
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(TestAutoFocusComponent);
    component = fixture.componentInstance;
    inputEl = fixture.debugElement.query(By.css('input'));
    focusDirective = inputEl.injector.get<FocusDirective>(FocusDirective);
  });

  // beforeEach(inject([FocusDirective], fd => {
  //   focusDirective = fd;
  // }));

  it('should create an instance', () => {
    expect(focusDirective).toBeTruthy();
  });
});
