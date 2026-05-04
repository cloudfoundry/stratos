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

    it('signal-handle submit() resolving with {ignoreSuccess:true} threads it through', async () => {
      component.signalHandle = {
        valid: signal(true).asReadonly(),
        submit: () => Promise.resolve({ ignoreSuccess: true }),
      };
      const result = await firstValueFrom(component.invokeNext(0));
      expect(result.success).toBe(true);
      expect(result.ignoreSuccess).toBe(true);
    });

    it('signal-handle submit() resolving with {} (no ignoreSuccess) reports plain success', async () => {
      component.signalHandle = {
        valid: signal(true).asReadonly(),
        submit: () => Promise.resolve(),
      };
      const result = await firstValueFrom(component.invokeNext(0));
      expect(result.success).toBe(true);
      expect(result.ignoreSuccess).toBeUndefined();
    });
  });

  describe('FWT-959 signal-handle UI fields', () => {
    const baseHandle = () => ({ valid: signal(true).asReadonly() });

    it('blocked: signal-handle wins over legacy storage', () => {
      component.blocked = false;
      component.signalHandle = { ...baseHandle(), blocked: signal(true).asReadonly() };
      expect(component.blocked).toBe(true);
    });

    it('blocked: falls back to legacy when handle has no blocked', () => {
      component.blocked = true;
      component.signalHandle = baseHandle();
      expect(component.blocked).toBe(true);
    });

    it('hidden: signal-handle wins over legacy storage', () => {
      component.hidden = false;
      component.signalHandle = { ...baseHandle(), hidden: signal(true).asReadonly() };
      expect(component.hidden).toBe(true);
    });

    it('canClose: signal-handle wins over legacy storage', () => {
      component.canClose = true;
      component.signalHandle = { ...baseHandle(), canClose: signal(false).asReadonly() };
      expect(component.canClose).toBe(false);
    });

    it('disablePrevious: signal-handle wins over legacy storage', () => {
      component.disablePrevious = false;
      component.signalHandle = { ...baseHandle(), disablePrevious: signal(true).asReadonly() };
      expect(component.disablePrevious).toBe(true);
    });

    it('destructiveStep: signal-handle wins over legacy storage', () => {
      component.destructiveStep = false;
      component.signalHandle = { ...baseHandle(), destructiveStep: signal(true).asReadonly() };
      expect(component.destructiveStep).toBe(true);
    });

    it('hideCloseButton: signal-handle wins over legacy storage', () => {
      component.hideCloseButton = false;
      component.signalHandle = { ...baseHandle(), hideCloseButton: signal(true).asReadonly() };
      expect(component.hideCloseButton).toBe(true);
    });

    it('showBusy: signal-handle wins over legacy storage', () => {
      component.showBusy = false;
      component.signalHandle = { ...baseHandle(), showBusy: signal(true).asReadonly() };
      expect(component.showBusy).toBe(true);
    });

    it('nextButtonText: signal-handle wins over legacy storage', () => {
      component.nextButtonText = 'Next';
      component.signalHandle = { ...baseHandle(), nextButtonText: signal('Apply').asReadonly() };
      expect(component.nextButtonText).toBe('Apply');
    });

    it('finishButtonText: signal-handle wins, supports state-driven toggling', () => {
      const txt = signal('Apply');
      component.signalHandle = { ...baseHandle(), finishButtonText: txt.asReadonly() };
      expect(component.finishButtonText).toBe('Apply');
      txt.set('Close');
      expect(component.finishButtonText).toBe('Close');
    });

    it('cancelButtonText: signal-handle wins over legacy storage', () => {
      component.cancelButtonText = 'Cancel';
      component.signalHandle = { ...baseHandle(), cancelButtonText: signal('Skip').asReadonly() };
      expect(component.cancelButtonText).toBe('Skip');
    });
  });

  describe('FWT-959 onEnter / onLeave delegation', () => {
    it('pOnEnter prefers signalHandle.onEnter over legacy onEnter', () => {
      const handleEnter = vi.fn();
      const legacyEnter = vi.fn();
      component.onEnter = legacyEnter;
      component.signalHandle = {
        valid: signal(true).asReadonly(),
        onEnter: handleEnter,
      };
      component.pOnEnter({ payload: 'x' });
      expect(handleEnter).toHaveBeenCalledWith({ payload: 'x' });
      expect(legacyEnter).not.toHaveBeenCalled();
    });

    it('pOnEnter falls back to legacy onEnter when handle has none', () => {
      const legacyEnter = vi.fn();
      component.onEnter = legacyEnter;
      component.signalHandle = { valid: signal(true).asReadonly() };
      component.pOnEnter('payload');
      expect(legacyEnter).toHaveBeenCalledWith('payload');
    });

    it('invokeLeave prefers signalHandle.onLeave over legacy onLeave', () => {
      const handleLeave = vi.fn();
      const legacyLeave = vi.fn();
      component.onLeave = legacyLeave;
      component.signalHandle = {
        valid: signal(true).asReadonly(),
        onLeave: handleLeave,
      };
      component.invokeLeave(true);
      expect(handleLeave).toHaveBeenCalledWith(true);
      expect(legacyLeave).not.toHaveBeenCalled();
    });

    it('invokeLeave falls back to legacy onLeave when handle has none', () => {
      const legacyLeave = vi.fn();
      component.onLeave = legacyLeave;
      component.signalHandle = { valid: signal(true).asReadonly() };
      component.invokeLeave(false);
      expect(legacyLeave).toHaveBeenCalledWith(false);
    });
  });
});
