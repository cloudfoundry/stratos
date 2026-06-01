import { CardCell, TableCellCustom } from './cell-base';

class TestCell extends TableCellCustom<{ name: string }> { }
class TestCard extends CardCell<{ name: string }> { }

describe('cell-base', () => {
  it('TableCellCustom exposes row/config/entityKey without an ngrx dataSource', () => {
    const c = new TestCell();
    c.row = { name: 'x' };
    c.config = { k: 1 } as any;
    c.entityKey = 'key';
    expect(c.row).toEqual({ name: 'x' });
    expect(c.config).toEqual({ k: 1 });
    expect(c.entityKey).toBe('key');
    expect('dataSource' in c).toBe(false); // ngrx coupling removed
  });

  it('CardCell extends TableCellCustom and keeps static columns', () => {
    expect(CardCell.columns).toBe(3);
    expect(new TestCard()).toBeInstanceOf(TableCellCustom);
  });
});
