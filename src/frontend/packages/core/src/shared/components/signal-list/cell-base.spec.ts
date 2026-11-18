import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CardCell, TableCellCustom } from './cell-base';

@Component({ template: '' })
class TestCell extends TableCellCustom<{ name: string }> { }
@Component({ template: '' })
class TestCard extends CardCell<{ name: string }> { }

describe('cell-base', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('TableCellCustom exposes row/config/entityKey without an ngrx dataSource', () => {
    const fixture = TestBed.createComponent(TestCell);
    fixture.componentRef.setInput('row', { name: 'x' });
    fixture.componentRef.setInput('config', { k: 1 });
    const c = fixture.componentInstance;
    c.entityKey = 'key';
    expect(c.row()).toEqual({ name: 'x' });
    expect(c.config()).toEqual({ k: 1 });
    expect(c.entityKey).toBe('key');
    expect('dataSource' in c).toBe(false); // ngrx coupling removed
  });

  it('config is undefined when the host does not bind it', () => {
    const fixture = TestBed.createComponent(TestCell);
    fixture.componentRef.setInput('row', { name: 'x' });
    expect(fixture.componentInstance.config()).toBeUndefined();
  });

  it('CardCell extends TableCellCustom and keeps static columns', () => {
    expect(CardCell.columns).toBe(3);
    expect(TestBed.createComponent(TestCard).componentInstance).toBeInstanceOf(TableCellCustom);
  });
});
