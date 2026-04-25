import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { firstValueFrom, of as observableOf } from 'rxjs';

import { StepComponent } from './step.component';

describe('StepComponent', () => {
  let component: StepComponent;
  let fixture: ComponentFixture<StepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        StepComponent,
      ],

    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('legacy valid/skip path (no signalHandle)', () => {
    it('valid getter returns the legacy boolean storage', () => {
      component.valid = true;
      expect(component.valid).toBe(true);
      component.valid = false;
      expect(component.valid).toBe(false);
    });

    it('skip getter returns the legacy boolean storage', () => {
      component.skip = false;
      expect(component.skip).toBe(false);
      component.skip = true;
      expect(component.skip).toBe(true);
    });
  });

  describe('signal-handle valid', () => {
    it('valid getter delegates to signalHandle.valid() when set', () => {
      const validSig = signal(false);
      component.signalHandle = { valid: validSig.asReadonly() };
      expect(component.valid).toBe(false);
      validSig.set(true);
      expect(component.valid).toBe(true);
    });

    it('signal-handle valid takes precedence over the legacy boolean', () => {
      component.valid = true;            // legacy storage
      component.signalHandle = { valid: signal(false).asReadonly() };
      expect(component.valid).toBe(false); // signal wins
    });
  });

  describe('signal-handle skipIf', () => {
    it('skip getter delegates to signalHandle.skipIf() when set', () => {
      const skipSig = signal(false);
      component.signalHandle = {
        valid: signal(true).asReadonly(),
        skipIf: skipSig.asReadonly(),
      };
      expect(component.skip).toBe(false);
      skipSig.set(true);
      expect(component.skip).toBe(true);
    });

    it('falls back to legacy skip when signalHandle has no skipIf', () => {
      component.skip = true;
      component.signalHandle = { valid: signal(true).asReadonly() }; // no skipIf
      expect(component.skip).toBe(true);
    });
  });

  describe('invokeNext dispatch', () => {
    it('legacy path delegates to onNext(index, this)', async () => {
      const onNext = vi.fn().mockReturnValue(observableOf({ success: true }));
      component.onNext = onNext;
      const result = await firstValueFrom(component.invokeNext(2));
      expect(onNext).toHaveBeenCalledWith(2, component);
      expect(result.success).toBe(true);
    });

    it('signal-handle with submit() resolves to {success:true}', async () => {
      const submit = vi.fn().mockResolvedValue(undefined);
      component.signalHandle = {
        valid: signal(true).asReadonly(),
        submit,
      };
      const result = await firstValueFrom(component.invokeNext(0));
      expect(submit).toHaveBeenCalledOnce();
      expect(result.success).toBe(true);
    });

    it('signal-handle without submit auto-succeeds', async () => {
      component.signalHandle = { valid: signal(true).asReadonly() };
      const result = await firstValueFrom(component.invokeNext(0));
      expect(result.success).toBe(true);
    });

    it('signal-handle with rejecting submit() resolves to {success:false, message}', async () => {
      component.signalHandle = {
        valid: signal(true).asReadonly(),
        submit: () => Promise.reject(new Error('boom')),
      };
      const result = await firstValueFrom(component.invokeNext(0));
      expect(result.success).toBe(false);
      expect(result.message).toBe('boom');
    });

    it('signal-handle submit() rejecting with non-Error stringifies the value', async () => {
      component.signalHandle = {
        valid: signal(true).asReadonly(),
        submit: () => Promise.reject('plain string fail'),
      };
      const result = await firstValueFrom(component.invokeNext(0));
      expect(result.success).toBe(false);
      expect(result.message).toBe('plain string fail');
    });
  });
});
