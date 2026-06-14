import {  Component, ViewChild, provideZonelessChangeDetection, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../core/core.module';
import { UnlimitedInputComponent } from './unlimited-input.component';

@Component({
  standalone: false,
  template: `
    <form [formGroup]="formGroup">
      <app-unlimited-input name="inputName"
        placeholder="Max amount of memory an app instance can have" suffix="MB">
      </app-unlimited-input>
    </form>`
})
class WrapperComponent {
  @ViewChild(UnlimitedInputComponent, { static: true })
  // strict: assigned by Angular's @ViewChild resolution before the test reads it
  unlimitedInput!: UnlimitedInputComponent;
  formGroup: UntypedFormGroup;

  constructor() {
    this.formGroup = new UntypedFormGroup({
      inputName: new UntypedFormControl(),
    });

  }
}

describe('UnlimitedInputComponent', () => {
  let component: UnlimitedInputComponent;
  let fixture: ComponentFixture<WrapperComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      declarations: [WrapperComponent],
      imports: [
        BrowserAnimationsModule,
        CoreModule,
        UnlimitedInputComponent,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });
      TestBed.compileComponents();
  });

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
    const input = element.querySelector<HTMLInputElement>('input[type=number]');
    const _checkbox = element.querySelector<HTMLInputElement>('input[type=checkbox]');
    expect(input).toBeTruthy();
    expect(_checkbox).toBeTruthy();

    // Toggle the unlimited flag and call onChange
    component.unlimited = true;
    component.onChange();
    fixture.detectChanges();

    // strict: presence asserted above; the rendered template always has the number input
    expect(input!.disabled).toBeTruthy();
  });

  it('should clear input when checkbox is checked', () => {
    const input = element.querySelector<HTMLInputElement>('input[type=number]');
    const _checkbox = element.querySelector<HTMLInputElement>('input[type=checkbox]');
    expect(input).toBeTruthy();
    expect(_checkbox).toBeTruthy();
    component.formControl.setValue(2);
    fixture.detectChanges();
    // strict: presence asserted above; the rendered template always has the number input
    expect(input!.value).toEqual('2');

    // Toggle to unlimited (clears the input),
    component.unlimited = true;
    component.onChange();
    fixture.detectChanges();
    expect(input!.value).toEqual('');
  });

  it('should preserve the previous value when checking and unchecking', () => {
    const input = element.querySelector<HTMLInputElement>('input[type=number]');
    const _checkbox = element.querySelector<HTMLInputElement>('input[type=checkbox]');
    expect(input).toBeTruthy();
    expect(_checkbox).toBeTruthy();
    component.formControl.setValue(2);
    fixture.detectChanges();
    // strict: presence asserted above; the rendered template always has the number input
    expect(input!.value).toEqual('2');

    // Toggle to unlimited (disable input),
    component.unlimited = true;
    component.onChange();
    fixture.detectChanges();
    expect(input!.value).toEqual('');

    // Toggle back from unlimited (enable input and restore value),
    component.unlimited = false;
    component.onChange();
    fixture.detectChanges();
    expect(input!.value).toEqual('2');
  });
});

