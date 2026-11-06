import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CustomFormFieldComponent } from './custom-form-field.component';

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
