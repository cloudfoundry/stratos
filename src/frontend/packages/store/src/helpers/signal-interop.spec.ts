import { Component, computed, Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, Subject } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import { describe, expect, it } from 'vitest';

import { combineLatestOrEmpty, createSignalWrapper, observeSignal } from './signal-interop';

describe('signal-interop', () => {

  describe('observeSignal', () => {
    // Reads the source through a computed that counts its evaluations, so a
    // still-running effect shows up as extra evaluations after a write.
    function countedSource(initial: number) {
      const source = signal(initial);
      let reads = 0;
      const counted = computed(() => {
        reads++;
        return source();
      });
      return { source, counted, reads: () => reads };
    }

    it('emits the current value on the first flush, then later writes', () => {
      const injector = TestBed.inject(Injector);
      const source = signal(1);
      const values: number[] = [];

      const sub = observeSignal(source, injector).subscribe(v => values.push(v));
      // Same timing as toObservable: nothing before the effect first runs.
      expect(values).toEqual([]);

      TestBed.tick();
      expect(values).toEqual([1]);

      source.set(2);
      TestBed.tick();
      source.set(3);
      TestBed.tick();
      expect(values).toEqual([1, 2, 3]);

      sub.unsubscribe();
    });

    it('stops reading the source after unsubscribe', () => {
      const injector = TestBed.inject(Injector);
      const { source, counted, reads } = countedSource(1);
      const values: number[] = [];

      const sub = observeSignal(counted, injector).subscribe(v => values.push(v));
      TestBed.tick();
      expect(values).toEqual([1]);
      const readsWhileSubscribed = reads();

      sub.unsubscribe();
      source.set(2);
      TestBed.tick();
      source.set(3);
      TestBed.tick();

      expect(reads()).toBe(readsWhileSubscribed);
      expect(values).toEqual([1]);
    });

    it('creates no effect until subscribed', () => {
      const injector = TestBed.inject(Injector);
      const { source, counted, reads } = countedSource(1);

      observeSignal(counted, injector);
      TestBed.tick();
      source.set(2);
      TestBed.tick();

      expect(reads()).toBe(0);
    });

    it('gives each subscriber its own effect', () => {
      const injector = TestBed.inject(Injector);
      const source = signal('a');
      const obs$ = observeSignal(source, injector);
      const first: string[] = [];
      const second: string[] = [];

      const sub1 = obs$.subscribe(v => first.push(v));
      const sub2 = obs$.subscribe(v => second.push(v));
      TestBed.tick();
      sub1.unsubscribe();
      source.set('b');
      TestBed.tick();

      expect(first).toEqual(['a']);
      expect(second).toEqual(['a', 'b']);
      sub2.unsubscribe();
    });

    it('keeps emitting after the view of a component injector is destroyed', () => {
      @Component({ template: '' })
      class HostComponent {}
      const fixture = TestBed.createComponent(HostComponent);
      const source = signal(1);
      const values: number[] = [];

      const sub = observeSignal(source, fixture.componentRef.injector).subscribe(v => values.push(v));
      TestBed.tick();
      fixture.destroy();
      source.set(2);
      TestBed.tick();

      expect(values).toEqual([1, 2]);
      sub.unsubscribe();
    });
  });

  describe('combineLatestOrEmpty', () => {
    it('emits [] once and completes for no sources', async () => {
      const emitted = await firstValueFrom(combineLatestOrEmpty<number>([]).pipe(toArray()));
      expect(emitted).toEqual([[]]);
    });

    it('behaves like combineLatest for non-empty sources', () => {
      const a = new Subject<number>();
      const b = new Subject<string>();
      const values: (number | string)[][] = [];
      let completed = false;

      combineLatestOrEmpty<number | string>([a, b]).subscribe({
        next: v => values.push(v),
        complete: () => (completed = true),
      });
      a.next(1);
      expect(values).toEqual([]);
      b.next('x');
      a.next(2);
      a.complete();
      b.complete();

      expect(values).toEqual([[1, 'x'], [2, 'x']]);
      expect(completed).toBe(true);
    });

    it('works with take(1) on synchronous sources', async () => {
      const result = await firstValueFrom(combineLatestOrEmpty([of(1), of(2)]).pipe(take(1)));
      expect(result).toEqual([1, 2]);
    });
  });

  describe('createSignalWrapper', () => {
    it('reflects writes in the signal read', () => {
      const wrapper = createSignalWrapper(1);
      expect(wrapper()).toBe(1);

      wrapper.set(2);
      expect(wrapper()).toBe(2);
      wrapper.next(3);
      expect(wrapper()).toBe(3);
      expect(wrapper.getValue()).toBe(3);
      wrapper.update(v => v + 1);
      expect(wrapper()).toBe(4);
      expect(wrapper.asReadonly()()).toBe(4);
    });

    it('asObservable works outside an injection context', () => {
      const wrapper = createSignalWrapper('a');
      const values: string[] = [];

      wrapper.asObservable().subscribe(v => values.push(v));

      expect(values).toEqual(['a']);
    });

    it('returns the same observable on every asObservable() call', () => {
      // Templates bind asObservable() directly; a new instance per change
      // detection pass would resubscribe and replay the last value.
      const wrapper = createSignalWrapper(0);

      expect(wrapper.asObservable()).toBe(wrapper.asObservable());
    });

    it('delivers every synchronous write to a subscriber', () => {
      const wrapper = createSignalWrapper(0);
      const values: number[] = [];
      wrapper.asObservable().subscribe(v => values.push(v));

      wrapper.next(1);
      wrapper.set(2);

      expect(values).toEqual([0, 1, 2]);
    });

    it('re-notifies the same reference with equal: () => false', () => {
      const state = { count: 0 };
      const wrapper = createSignalWrapper(state, { equal: () => false });
      const observed: number[] = [];
      wrapper.asObservable().subscribe(v => observed.push(v.count));
      let signalRuns = 0;
      const tracked = computed(() => {
        wrapper();
        return ++signalRuns;
      });
      expect(tracked()).toBe(1);

      state.count++;
      wrapper.next(state);

      expect(tracked()).toBe(2);
      expect(observed).toEqual([0, 1]);
    });

    it('dedupes the same reference in the signal by default', () => {
      const state = { count: 0 };
      const wrapper = createSignalWrapper(state);
      let signalRuns = 0;
      const tracked = computed(() => {
        wrapper();
        return ++signalRuns;
      });
      expect(tracked()).toBe(1);

      wrapper.next(state);

      expect(tracked()).toBe(1);
    });
  });
});
