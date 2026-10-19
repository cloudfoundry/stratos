import { effect, EnvironmentInjector, Injector, signal, Signal, untracked, ValueEqualityFn, WritableSignal } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';

/**
 * Observe a signal for as long as the subscription lives.
 *
 * Unlike toObservable(), which creates its effect when it is called and only
 * ends it when the injector is destroyed (unsubscribing does nothing), this
 * creates the effect on subscribe and destroys it on unsubscribe. That makes
 * it safe with a long-lived injector such as the root one, where
 * toObservable() would leave an effect running forever per call.
 *
 * The effect is created on the injector's EnvironmentInjector. With a
 * component's injector it would be a view effect, end with that view, and
 * leave the observable silent without completing. So the effect lives as
 * long as the subscription; a subscriber that must stop with a view
 * unsubscribes itself (takeUntilDestroyed).
 *
 * Timing matches toObservable(): the first value comes from the effect's
 * first run, not synchronously on subscribe.
 */
export function observeSignal<T>(source: Signal<T>, injector: Injector): Observable<T> {
  return new Observable<T>(subscriber => {
    const ref = effect(() => {
      const value = source();
      untracked(() => subscriber.next(value));
    }, { injector: injector.get(EnvironmentInjector), manualCleanup: true });
    return () => ref.destroy();
  });
}

/**
 * combineLatest() that emits [] for an empty list. combineLatest([]) completes
 * without emitting, which leaves take(1) and loading indicators waiting.
 */
export function combineLatestOrEmpty<T>(sources: Observable<T>[]): Observable<T[]> {
  return sources.length ? combineLatest(sources) : of([]);
}

/**
 * A writable signal that also offers the BehaviorSubject API (next, getValue,
 * asObservable), for code moving from subjects to signals.
 *
 * asObservable() is backed by a BehaviorSubject updated on every write, so it
 * is synchronous, emits every write (no coalescing per change detection
 * pass), needs no injection context and outlives the view that created it.
 * It returns the same observable on every call, so a template can bind it.
 *
 * Pass `equal: () => false` when callers mutate a value in place and write
 * the same reference again; the default equality would drop those updates
 * from the signal.
 */
export function createSignalWrapper<T>(initialValue: T, options?: { equal?: ValueEqualityFn<T> }) {
  const _signal = signal<T>(initialValue, options?.equal ? { equal: options.equal } : undefined);
  const _subject = new BehaviorSubject<T>(initialValue);
  const _observable = _subject.asObservable();
  const write = (value: T) => {
    _signal.set(value);
    _subject.next(value);
  };
  const wrapper = Object.assign(
    () => _signal(),
    {
      set: write,
      update: (fn: (value: T) => T) => write(fn(_signal())),
      asReadonly: () => _signal.asReadonly(),
      next: write,
      getValue: () => _signal(),
      asObservable: () => _observable,
    }
  );
  return wrapper as WritableSignal<T> & {
    next: (value: T) => void;
    getValue: () => T;
    asObservable: () => Observable<T>;
  };
}
