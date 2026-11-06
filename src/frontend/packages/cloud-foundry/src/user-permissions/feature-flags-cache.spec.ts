import { BehaviorSubject } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { StFeatureFlag } from '../services/endpoint-data/stratos-types';
import { featureFlagsAfterLoad$ } from './feature-flags-cache';

const flag = (name: string, enabled: boolean): StFeatureFlag =>
  ({ name, enabled } as StFeatureFlag);

describe('featureFlagsAfterLoad$', () => {
  it('does not build the items stream until load() resolves, then emits the loaded value', async () => {
    // The cache source starts with an empty items list and fills it async via
    // load(). A consumer using take(1) must not capture that pre-load empty
    // state (the bug that disabled set/unset-roles-by-username despite the
    // flags being enabled).
    const items$ = new BehaviorSubject<StFeatureFlag[]>([]);
    let factoryCalled = false;
    const itemsFactory = () => { factoryCalled = true; return items$; };
    let resolveLoad!: () => void;
    const load = () => new Promise<void>(r => { resolveLoad = r; });

    const emissions: StFeatureFlag[][] = [];
    const sub = featureFlagsAfterLoad$(load, itemsFactory).subscribe(v => emissions.push(v));

    // The items stream is not even built while load() is pending — this is
    // what prevents toObservable() from buffering the pre-load empty signal.
    expect(factoryCalled).toBe(false);
    expect(emissions).toEqual([]);

    // Flags arrive, then load completes.
    items$.next([flag('set_roles_by_username', true)]);
    resolveLoad();
    await Promise.resolve();
    await Promise.resolve();

    expect(factoryCalled).toBe(true);
    expect(emissions[0]).toEqual([flag('set_roles_by_username', true)]);
    sub.unsubscribe();
  });

  it('propagates later flag changes after the initial load', async () => {
    const items$ = new BehaviorSubject<StFeatureFlag[]>([flag('a', false)]);
    const load = () => Promise.resolve();

    const emissions: StFeatureFlag[][] = [];
    const sub = featureFlagsAfterLoad$(load, () => items$).subscribe(v => emissions.push(v));
    await Promise.resolve();
    await Promise.resolve();

    items$.next([flag('a', true)]);

    expect(emissions).toEqual([[flag('a', false)], [flag('a', true)]]);
    sub.unsubscribe();
  });
});
