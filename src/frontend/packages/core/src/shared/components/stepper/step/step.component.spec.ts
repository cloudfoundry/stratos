import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';

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

  beforeEach(async () => {
    fixture = TestBed.createComponent(StepComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('legacy valid/skip path (no signalHandle)', () => {
    it('effectiveValid returns the [valid] input', () => {
      fixture.componentRef.setInput('valid', true);
      expect(component.effectiveValid).toBe(true);
      fixture.componentRef.setInput('valid', false);
      expect(component.effectiveValid).toBe(false);
    });

    it('effectiveSkip returns the [skip] input', () => {
      fixture.componentRef.setInput('skip', false);
      expect(component.effectiveSkip).toBe(false);
      fixture.componentRef.setInput('skip', true);
      expect(component.effectiveSkip).toBe(true);
    });
  });

  describe('signal-handle valid', () => {
    it('effectiveValid delegates to signalHandle.valid() when set', () => {
      const validSig = signal(false);
      fixture.componentRef.setInput('signalHandle', { valid: validSig.asReadonly() });
      expect(component.effectiveValid).toBe(false);
      validSig.set(true);
      expect(component.effectiveValid).toBe(true);
    });

    it('signal-handle valid takes precedence over the legacy boolean', () => {
      fixture.componentRef.setInput('valid', true);            // the [valid] input
      fixture.componentRef.setInput('signalHandle', { valid: signal(false).asReadonly() });
      expect(component.effectiveValid).toBe(false); // signal wins
    });
  });

  describe('signal-handle skipIf', () => {
    it('effectiveSkip delegates to signalHandle.skipIf() when set', () => {
      const skipSig = signal(false);
      fixture.componentRef.setInput('signalHandle', {
        valid: signal(true).asReadonly(),
        skipIf: skipSig.asReadonly(),
      });
      expect(component.effectiveSkip).toBe(false);
      skipSig.set(true);
      expect(component.effectiveSkip).toBe(true);
    });

    it('falls back to legacy skip when signalHandle has no skipIf', () => {
      fixture.componentRef.setInput('skip', true);
      fixture.componentRef.setInput('signalHandle', { valid: signal(true).asReadonly() }); // no skipIf
      expect(component.effectiveSkip).toBe(true);
    });
  });

  describe('invokeNext dispatch', () => {
    it('a step without a signalHandle auto-succeeds', async () => {
      const result = await component.invokeNext();
      expect(result.success).toBe(true);
    });

    it('signal-handle submit() throwing synchronously resolves to {success:false, message}', async () => {
      fixture.componentRef.setInput('signalHandle', {
        valid: signal(true).asReadonly(),
        submit: () => { throw new Error('boom'); },
      });
      const result = await component.invokeNext();
      expect(result.success).toBe(false);
      expect(result.message).toBe('boom');
    });

    it('signal-handle with submit() resolves to {success:true}', async () => {
      const submit = vi.fn().mockResolvedValue(undefined);
      fixture.componentRef.setInput('signalHandle', {
        valid: signal(true).asReadonly(),
        submit,
      });
      const result = await component.invokeNext();
      expect(submit).toHaveBeenCalledOnce();
      expect(result.success).toBe(true);
    });

    it('signal-handle without submit auto-succeeds', async () => {
      fixture.componentRef.setInput('signalHandle', { valid: signal(true).asReadonly() });
      const result = await component.invokeNext();
      expect(result.success).toBe(true);
    });

    it('signal-handle with rejecting submit() resolves to {success:false, message}', async () => {
      fixture.componentRef.setInput('signalHandle', {
        valid: signal(true).asReadonly(),
        submit: () => Promise.reject(new Error('boom')),
      });
      const result = await component.invokeNext();
      expect(result.success).toBe(false);
      expect(result.message).toBe('boom');
    });

    it('signal-handle submit() rejecting with non-Error stringifies the value', async () => {
      fixture.componentRef.setInput('signalHandle', {
        valid: signal(true).asReadonly(),
        submit: () => Promise.reject('plain string fail'),
      });
      const result = await component.invokeNext();
      expect(result.success).toBe(false);
      expect(result.message).toBe('plain string fail');
    });

    it('signal-handle submit() rejecting with an HTTP error shows the reason CF gave', async () => {
      fixture.componentRef.setInput('signalHandle', {
        valid: signal(true).asReadonly(),
        submit: () => Promise.reject(new HttpErrorResponse({ error: { errors: [{ code: 10008, title: 'CF-UnprocessableEntity', detail: 'Name must be unique' }] }, status: 422, statusText: 'Unprocessable Entity' })),
      });
      const result = await component.invokeNext();
      expect(result.success).toBe(false);
      expect(result.message).toBe('Name must be unique');
    });

    it('signal-handle submit() rejecting with an HTML error page gives its heading as a piece', async () => {
      fixture.componentRef.setInput('signalHandle', {
        valid: signal(true).asReadonly(),
        submit: () => Promise.reject(new HttpErrorResponse({ error: '<html><body><h1>503 Service Unavailable</h1>\nNo server is available to handle this request.\n</body></html>\n', status: 503, statusText: 'Service Unavailable' })),
      });
      const result = await component.invokeNext();
      expect(result.success).toBe(false);
      expect(result.message).toBe('503 Service Unavailable\nNo server is available to handle this request.');
      expect(result.messagePieces).toEqual([
        { text: '503 Service Unavailable', style: 'heading' },
        { text: '\nNo server is available to handle this request.', style: 'text' },
      ]);
    });

    it('signal-handle submit() resolving with {ignoreSuccess:true} threads it through', async () => {
      fixture.componentRef.setInput('signalHandle', {
        valid: signal(true).asReadonly(),
        submit: () => Promise.resolve({ ignoreSuccess: true }),
      });
      const result = await component.invokeNext();
      expect(result.success).toBe(true);
      expect(result.ignoreSuccess).toBe(true);
    });

    it('signal-handle submit() resolving with {} (no ignoreSuccess) reports plain success', async () => {
      fixture.componentRef.setInput('signalHandle', {
        valid: signal(true).asReadonly(),
        submit: () => Promise.resolve(),
      });
      const result = await component.invokeNext();
      expect(result.success).toBe(true);
      expect(result.ignoreSuccess).toBeUndefined();
    });
  });

  describe('FWT-959 signal-handle UI fields', () => {
    const baseHandle = () => ({ valid: signal(true).asReadonly() });

    it('blocked: signal-handle wins over legacy storage', () => {
      fixture.componentRef.setInput('blocked', false);
      fixture.componentRef.setInput('signalHandle', { ...baseHandle(), blocked: signal(true).asReadonly() });
      expect(component.effectiveBlocked).toBe(true);
    });

    it('blocked: falls back to legacy when handle has no blocked', () => {
      fixture.componentRef.setInput('blocked', true);
      fixture.componentRef.setInput('signalHandle', baseHandle());
      expect(component.effectiveBlocked).toBe(true);
    });

    it('hidden: signal-handle wins over legacy storage', () => {
      fixture.componentRef.setInput('hidden', false);
      fixture.componentRef.setInput('signalHandle', { ...baseHandle(), hidden: signal(true).asReadonly() });
      expect(component.effectiveHidden).toBe(true);
    });

    it('canClose: signal-handle wins over legacy storage', () => {
      fixture.componentRef.setInput('canClose', true);
      fixture.componentRef.setInput('signalHandle', { ...baseHandle(), canClose: signal(false).asReadonly() });
      expect(component.effectiveCanClose).toBe(false);
    });

    it('disablePrevious: signal-handle wins over legacy storage', () => {
      fixture.componentRef.setInput('disablePrevious', false);
      fixture.componentRef.setInput('signalHandle', { ...baseHandle(), disablePrevious: signal(true).asReadonly() });
      expect(component.effectiveDisablePrevious).toBe(true);
    });

    it('destructiveStep: signal-handle wins over legacy storage', () => {
      fixture.componentRef.setInput('destructiveStep', false);
      fixture.componentRef.setInput('signalHandle', { ...baseHandle(), destructiveStep: signal(true).asReadonly() });
      expect(component.effectiveDestructiveStep).toBe(true);
    });

    it('hideCloseButton: signal-handle wins over legacy storage', () => {
      fixture.componentRef.setInput('hideCloseButton', false);
      fixture.componentRef.setInput('signalHandle', { ...baseHandle(), hideCloseButton: signal(true).asReadonly() });
      expect(component.effectiveHideCloseButton).toBe(true);
    });

    it('showBusy: signal-handle wins over legacy storage', () => {
      fixture.componentRef.setInput('showBusy', false);
      fixture.componentRef.setInput('signalHandle', { ...baseHandle(), showBusy: signal(true).asReadonly() });
      expect(component.effectiveShowBusy).toBe(true);
    });

    it('nextButtonText: signal-handle wins over legacy storage', () => {
      fixture.componentRef.setInput('nextButtonText', 'Next');
      fixture.componentRef.setInput('signalHandle', { ...baseHandle(), nextButtonText: signal('Apply').asReadonly() });
      expect(component.effectiveNextButtonText).toBe('Apply');
    });

    it('finishButtonText: signal-handle wins, supports state-driven toggling', () => {
      const txt = signal('Apply');
      fixture.componentRef.setInput('signalHandle', { ...baseHandle(), finishButtonText: txt.asReadonly() });
      expect(component.effectiveFinishButtonText).toBe('Apply');
      txt.set('Close');
      expect(component.effectiveFinishButtonText).toBe('Close');
    });

    it('cancelButtonText: signal-handle wins over legacy storage', () => {
      fixture.componentRef.setInput('cancelButtonText', 'Cancel');
      fixture.componentRef.setInput('signalHandle', { ...baseHandle(), cancelButtonText: signal('Skip').asReadonly() });
      expect(component.effectiveCancelButtonText).toBe('Skip');
    });
  });

  describe('FWT-959 onEnter / onLeave delegation', () => {
    it('pOnEnter prefers signalHandle.onEnter over legacy onEnter', () => {
      const handleEnter = vi.fn();
      const legacyEnter = vi.fn();
      fixture.componentRef.setInput('onEnter', legacyEnter);
      fixture.componentRef.setInput('signalHandle', {
        valid: signal(true).asReadonly(),
        onEnter: handleEnter,
      });
      component.pOnEnter({ payload: 'x' });
      expect(handleEnter).toHaveBeenCalledWith({ payload: 'x' });
      expect(legacyEnter).not.toHaveBeenCalled();
    });

    it('pOnEnter falls back to legacy onEnter when handle has none', () => {
      const legacyEnter = vi.fn();
      fixture.componentRef.setInput('onEnter', legacyEnter);
      fixture.componentRef.setInput('signalHandle', { valid: signal(true).asReadonly() });
      component.pOnEnter('payload');
      expect(legacyEnter).toHaveBeenCalledWith('payload');
    });

    it('invokeLeave prefers signalHandle.onLeave over legacy onLeave', () => {
      const handleLeave = vi.fn();
      const legacyLeave = vi.fn();
      fixture.componentRef.setInput('onLeave', legacyLeave);
      fixture.componentRef.setInput('signalHandle', {
        valid: signal(true).asReadonly(),
        onLeave: handleLeave,
      });
      component.invokeLeave(true);
      expect(handleLeave).toHaveBeenCalledWith(true);
      expect(legacyLeave).not.toHaveBeenCalled();
    });

    it('invokeLeave falls back to legacy onLeave when handle has none', () => {
      const legacyLeave = vi.fn();
      fixture.componentRef.setInput('onLeave', legacyLeave);
      fixture.componentRef.setInput('signalHandle', { valid: signal(true).asReadonly() });
      component.invokeLeave(false);
      expect(legacyLeave).toHaveBeenCalledWith(false);
    });
  });
});
