import { Component, ViewChild } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../core/core.module';
import { UnlimitedInputComponent } from './unlimited-input.component';

@Component({
  template: `
    <form [formGroup]="formGroup">
      <app-unlimited-input name="inputName"
        placeholder="Max amount of memory an app instance can have" suffix="MB">
      </app-unlimited-input>
    </form>`
})
class WrapperComponent {
  @ViewChild(UnlimitedInputComponent, { static: true })
  unlimitedInput: UnlimitedInputComponent;
  formGroup: FormGroup;

  constructor() {
    this.formGroup = new FormGroup({
      inputName: new FormControl()
    });

  }
}

describe('UnlimitedInputComponent', () => {
  let component: UnlimitedInputComponent;
  let fixture: ComponentFixture<WrapperComponent>;
  let element: HTMLElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [WrapperComponent, UnlimitedInputComponent],
      imports: [
        BrowserAnimationsModule,
        CoreModule,
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WrapperComponent);
    component = fixture.componentInstance.unlimitedInput;
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show checkbox', () => {
    expect(element.querySelector('input[type=checkbox]')).toBeTruthy();
  });

  it('should not display suffix', () => {
    expect(element.querySelector('matsuffix')).toBeFalsy();
  });

  it('should display custom suffix', () => {
    component.suffix = 'MB';
    fixture.detectChanges();
    expect(element.textContent).toContain('MB');
  });

  it('should disable input if checkbox checked', () => {
    const input: HTMLInputElement = element.querySelector('input[type=number]');
    const checkbox: HTMLInputElement = element.querySelector('input[type=checkbox]');
    checkbox.click();
    fixture.detectChanges();

    expect(input.disabled).toBeTruthy();
  });

  it('should clear input when checkbox is checked', () => {
    const input: HTMLInputElement = element.querySelector('input[type=number]');
    const checkbox: HTMLInputElement = element.querySelector('input[type=checkbox]');
    component.formControl.setValue(2);
    fixture.detectChanges();
    expect(input.value).toEqual('2');

    checkbox.click();
    fixture.detectChanges();
    expect(input.value).toEqual('');
  });

  it('should preserve the previous value when checking and unchecking', () => {
    const input: HTMLInputElement = element.querySelector('input[type=number]');
    const checkbox: HTMLInputElement = element.querySelector('input[type=checkbox]');
    component.formControl.setValue(2);
    expect(input.value).toEqual('2');
    fixture.detectChanges();

    checkbox.click();
    fixture.detectChanges();
    expect(input.value).toEqual('');

    checkbox.click();
    fixture.detectChanges();
    expect(input.value).toEqual('2');
  });
});

