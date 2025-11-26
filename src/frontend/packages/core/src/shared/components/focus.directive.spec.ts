import { FocusDirective } from './focus.directive';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Component, type DebugElement, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
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
        provideHttpClient(),
        provideHttpClientTesting(),
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
