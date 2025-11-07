import { FocusDirective } from './focus.directive';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Component, DebugElement, provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';

@Component({
  standalone: true,
  imports: [FocusDirective],
  template: `<input type="text" [appFocus]="shouldFocus"/>`
})
class TestAutoFocusComponent {
  shouldFocus = true;
}

describe('FocusDirective', () => {

  let component: TestAutoFocusComponent;
  let fixture: ComponentFixture<TestAutoFocusComponent>;
  let inputEl: DebugElement;
  let focusDirective: FocusDirective;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestAutoFocusComponent],
      providers: [
        provideZonelessChangeDetection(),
      ]
    });
    fixture = TestBed.createComponent(TestAutoFocusComponent);
    component = fixture.componentInstance;

    inputEl = fixture.debugElement.query(By.css('input'));

    focusDirective = inputEl.injector.get<FocusDirective>(FocusDirective);

    fixture.detectChanges();
  });

  it('should create an instance', () => {
    expect(focusDirective).toBeTruthy();
  });
});
