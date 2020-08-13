import { FocusDirective } from './focus.directive';
import { inject, TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, DebugElement, ElementRef, Renderer2 } from '@angular/core';
import { By, BrowserModule } from '@angular/platform-browser';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../shared.module';
import { CommonModule } from '@angular/common';

@Component({
  template: `<input type="text" autoFocus/>`
})
class TestAutoFocusComponent {
}

export class MockElementRef { }
export class MockRenderer { }

describe('FocusDirective', () => {

  let component: TestAutoFocusComponent;
  let fixture: ComponentFixture<TestAutoFocusComponent>;
  let inputEl: DebugElement;
  let focusDirective: FocusDirective;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FocusDirective,
        { provide: ElementRef, useClass: MockElementRef },
        { provide: Renderer2, useClass: MockRenderer }
      ],
      declarations: [
        TestAutoFocusComponent,
      ],
      imports: [
        CoreModule,
        BrowserModule,
        CommonModule,
        SharedModule,
      ]
    }).compileComponents();
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
