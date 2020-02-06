import { Component, DebugElement, ElementRef, Renderer2 } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ButtonBlurOnClickDirective } from './button-blur-on-click.directive';


@Component({
  template: `<button mat-icon-button></button>`
})
class TestButtonComponent {
}

class MockElementRef { }
class MockRenderer { }

describe('ButtonBlurOnClickDirective', () => {

  let component: TestButtonComponent;
  let fixture: ComponentFixture<TestButtonComponent>;
  let inputEl: DebugElement;
  let buttonBlurDirective: ButtonBlurOnClickDirective;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ElementRef, useClass: MockElementRef },
        { provide: Renderer2, useClass: MockRenderer }
      ],
      declarations: [
        TestButtonComponent,
        ButtonBlurOnClickDirective
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TestButtonComponent);
    component = fixture.componentInstance;

    inputEl = fixture.debugElement.query(By.css('button'));

    buttonBlurDirective = inputEl.injector.get<ButtonBlurOnClickDirective>(ButtonBlurOnClickDirective);

    fixture.detectChanges();
  });

  it('should create an instance', () => {
    expect(buttonBlurDirective).toBeTruthy();
  });

});
