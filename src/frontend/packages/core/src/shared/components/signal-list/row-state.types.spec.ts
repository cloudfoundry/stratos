import { getDefaultRowState, RowState } from './row-state.types';

describe('row-state.types', () => {
  it('getDefaultRowState returns a neutral RowState', () => {
    const s: RowState = getDefaultRowState();
    expect(s).toBeTruthy();
    expect(s.busy).toBe(false);
    expect(s.error).toBe(false);
    expect(s.blocked).toBe(false);
    expect(s.deleting).toBe(false);
    expect(s.message).toBeNull();
  });

  it('RowState allows optional boolean fields', () => {
    const s: RowState = {
      busy: true,
      error: false,
      blocked: false,
      deleting: false,
      highlighted: true,
      warning: false,
      disabled: false,
      message: 'test',
    };
    expect(s.highlighted).toBe(true);
    expect(s.message).toBe('test');
  });
});
