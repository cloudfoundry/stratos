import { describe, it, expect } from 'vitest';
import { of } from 'rxjs';

import { IListAction, IMultiListAction, IGlobalListAction } from './list-action.types';

describe('list-action.types', () => {
  it('IListAction carries a label + per-row action and optional row visibility', () => {
    let called = false;
    const a: IListAction<{ id: string }> = {
      label: 'Do',
      action: () => { called = true; },
      createVisible: () => of(true),
    };
    a.action({ id: 'x' });
    expect(called).toBe(true);
    expect(a.label).toBe('Do');
  });

  it('IMultiListAction.action may signal selection-clear', () => {
    const m: IMultiListAction<number> = { label: 'Bulk', action: () => true };
    expect(m.action([1, 2])).toBe(true);
  });

  it('IGlobalListAction has a no-arg action', () => {
    let n = 0;
    const g: IGlobalListAction<number> = { label: 'Add', action: () => { n++; } };
    g.action();
    expect(n).toBe(1);
  });
});
