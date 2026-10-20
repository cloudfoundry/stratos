import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AppErrorComponent, AppInputDirective, CustomFormFieldComponent } from './custom-form-field.component';

describe('CustomFormFieldComponent — Tailwind state-class getters (FWT-956)', () => {
  let component: CustomFormFieldComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [CustomFormFieldComponent],
    });
    const fixture = TestBed.createComponent(CustomFormFieldComponent);
    component = fixture.componentInstance;
  });

  describe('prefixSuffixColorClasses', () => {
    it('returns muted text when no state flags are set', () => {
      expect(component.prefixSuffixColorClasses).toContain('text-content-muted');
    });

    it('returns focus-border text when focused (no validity yet)', () => {
      component.focused = true;
      expect(component.prefixSuffixColorClasses).toContain('text-input-focus-border');
    });

    it('invalid takes precedence over focused', () => {
      component.focused = true;
      // isInvalid getter requires ngControl; we mimic by stubbing the getter behavior
      // through the underlying flag. Direct-property simulation of NgControl is heavier
      // than this test needs — test the getter via spying on isInvalid.
      Object.defineProperty(component, 'isInvalid', { get: () => true, configurable: true });
      expect(component.prefixSuffixColorClasses).toContain('text-danger');
    });

    it('valid takes precedence over focused (and falls back when not invalid)', () => {
      component.focused = true;
      Object.defineProperty(component, 'isInvalid', { get: () => false, configurable: true });
      Object.defineProperty(component, 'isValid', { get: () => true, configurable: true });
      expect(component.prefixSuffixColorClasses).toContain('text-success');
    });
  });

  describe('underlineColorClasses', () => {
    it('returns input-border bg when no state flags are set', () => {
      expect(component.underlineColorClasses).toContain('bg-input-border');
    });

    it('returns transparent when focused (and not yet validated)', () => {
      component.focused = true;
      expect(component.underlineColorClasses).toContain('bg-transparent');
    });

    it('invalid colors the underline danger regardless of focus', () => {
      component.focused = true;
      Object.defineProperty(component, 'isInvalid', { get: () => true, configurable: true });
      expect(component.underlineColorClasses).toContain('bg-danger');
    });

    it('valid colors the underline success', () => {
      Object.defineProperty(component, 'isInvalid', { get: () => false, configurable: true });
      Object.defineProperty(component, 'isValid', { get: () => true, configurable: true });
      expect(component.underlineColorClasses).toContain('bg-success');
    });
  });

  describe('rippleColorClasses', () => {
    it('default: focus-border bg, scale-x-0 (collapsed)', () => {
      const cls = component.rippleColorClasses;
      expect(cls).toContain('bg-input-focus-border');
      expect(cls).toContain('scale-x-0');
    });

    it('focused: scale-x-100 (expanded)', () => {
      component.focused = true;
      expect(component.rippleColorClasses).toContain('scale-x-100');
    });

    it('color=accent uses accent bg', () => {
      component.color = 'accent';
      expect(component.rippleColorClasses).toContain('bg-accent');
    });

    it('color=warn forces danger bg', () => {
      component.color = 'warn';
      expect(component.rippleColorClasses).toContain('bg-danger');
    });

    it('invalid forces danger bg even when color=accent', () => {
      component.color = 'accent';
      Object.defineProperty(component, 'isInvalid', { get: () => true, configurable: true });
      expect(component.rippleColorClasses).toContain('bg-danger');
    });

    it('valid uses success bg', () => {
      Object.defineProperty(component, 'isInvalid', { get: () => false, configurable: true });
      Object.defineProperty(component, 'isValid', { get: () => true, configurable: true });
      expect(component.rippleColorClasses).toContain('bg-success');
    });
  });
});

@Component({
  template: `
    <app-form-field>
      <input appInput [formControl]="name" placeholder="Name" required>
      @if (name.hasError('taken')) {
        <app-error>That name is taken</app-error>
      }
    </app-form-field>
  `,
  imports: [ReactiveFormsModule, CustomFormFieldComponent, AppInputDirective, AppErrorComponent],
})
class ProjectedErrorHostComponent {
  name = new FormControl('', [
    Validators.required,
    (c: AbstractControl): ValidationErrors | null => (c.value === 'taken' ? { taken: true } : null),
  ]);
}

describe('CustomFormFieldComponent — projected <app-error>', () => {
  async function setup() {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [ProjectedErrorHostComponent],
    });
    const fixture = TestBed.createComponent(ProjectedErrorHostComponent);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const input = host.querySelector<HTMLInputElement>('input')!;
    return { fixture, host, input };
  }

  function type(input: HTMLInputElement, value: string) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /** The field's error line, read through the input's aria-errormessage. */
  function errorFor(host: HTMLElement, input: HTMLInputElement): string | undefined {
    const id = input.getAttribute('aria-errormessage');
    return id ? host.querySelector(`#${id}`)?.textContent?.trim() : undefined;
  }

  it('shows the projected text instead of the stock line', async () => {
    const { fixture, host, input } = await setup();
    type(input, 'taken');
    await fixture.whenStable();

    const line = host.querySelector('.form-field-error');
    expect(line?.textContent?.trim()).toBe('That name is taken');
    expect(host.textContent).not.toContain('Invalid value');
  });

  it('shows the stock line when no projected error is rendered', async () => {
    const { fixture, host, input } = await setup();
    type(input, 'x');
    type(input, '');
    await fixture.whenStable();

    expect(host.querySelector('app-error')).toBeNull();
    expect(host.querySelector('.form-field-error')?.textContent?.trim()).toBe('This field is required');
  });

  it('shows no error while the field shows no errors', async () => {
    const { fixture, host } = await setup();
    fixture.componentInstance.name.setValue('taken');
    await fixture.whenStable();

    expect(host.querySelector('.form-field-error')).toBeNull();
    expect(host.textContent).not.toContain('That name is taken');
  });

  it('makes the projected text the accessible error message', async () => {
    const { fixture, host, input } = await setup();
    type(input, 'taken');
    await fixture.whenStable();

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(errorFor(host, input)).toBe('That name is taken');
  });

  it('goes back to the stock line when the projected error clears', async () => {
    const { fixture, host, input } = await setup();
    type(input, 'taken');
    await fixture.whenStable();
    type(input, '');
    await fixture.whenStable();

    expect(errorFor(host, input)).toBe('This field is required');
  });
});
