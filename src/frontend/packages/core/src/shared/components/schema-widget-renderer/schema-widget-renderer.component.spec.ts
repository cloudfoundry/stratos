import { describe, it, expect } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SchemaWidgetRendererComponent } from './schema-widget-renderer.component';

function mount(schema: any, data: any = {}) {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const f = TestBed.createComponent(SchemaWidgetRendererComponent);
  f.componentInstance.schema = schema;
  f.componentInstance.data = data;
  f.detectChanges();
  return f;
}

describe('SchemaWidgetRenderer array + multiselect', () => {
  it('array add/remove emits array data', () => {
    const f = mount({ type: 'object', properties: { hosts: { type: 'array', items: { type: 'string' } } } });
    let emitted: any; f.componentInstance.changes.subscribe((d: any) => (emitted = d));
    f.nativeElement.querySelector('button[data-add="/hosts"]').click(); f.detectChanges();
    const input = f.nativeElement.querySelector('input[data-path="/hosts/0"]');
    input.value = 'h1'; input.dispatchEvent(new Event('input')); f.detectChanges();
    expect(emitted.hosts).toEqual(['h1']);
  });

  it('renders a uniqueItems enum array as a multi-select checkbox group', () => {
    const f = mount({ type: 'object', properties: {
      zones: { type: 'array', uniqueItems: true, items: { enum: ['a', 'b', 'c'] } },
    } });
    let emitted: any; f.componentInstance.changes.subscribe((d: any) => (emitted = d));
    const cb = f.nativeElement.querySelector('input[type=checkbox][data-multi="/zones"][value="b"]');
    cb.checked = true; cb.dispatchEvent(new Event('change')); f.detectChanges();
    expect(emitted.zones).toEqual(['b']);
  });
});

describe('SchemaWidgetRenderer object/scalar/enum', () => {
  it('renders a nested object as nested inputs and emits nested data', () => {
    const schema = { type: 'object', properties: {
      network: { type: 'object', properties: { cidr: { type: 'string' } } },
    } };
    const f = mount(schema);
    let emitted: any;
    f.componentInstance.changes.subscribe((d: any) => (emitted = d));
    const input: HTMLInputElement = f.nativeElement.querySelector('input[data-path="/network/cidr"]');
    expect(input).toBeTruthy();                     // nesting rendered (was lost)
    input.value = '10.0.0.0/8'; input.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(emitted.network.cidr).toBe('10.0.0.0/8'); // nested write
  });

  it('renders enum as a select', () => {
    const f = mount({ type: 'object', properties: { tier: { enum: ['bronze', 'gold'] } } });
    expect(f.nativeElement.querySelector('select[data-path="/tier"]')).toBeTruthy();
  });

  it('re-renders fields when the schema input is reassigned on the same instance', () => {
    const schemaA = { type: 'object', properties: { a: { type: 'string' } } };
    const schemaB = { type: 'object', properties: { b: { type: 'string' } } };
    const f = mount(schemaA);
    expect(f.nativeElement.querySelector('input[data-path="/a"]')).toBeTruthy();
    // Task 10: selecting a different service plan reassigns [schema] on the SAME
    // instance — fields must rebuild so the form reflects the new schema.
    f.componentInstance.schema = schemaB;
    f.componentInstance.ngOnChanges();
    f.detectChanges();
    expect(f.nativeElement.querySelector('input[data-path="/b"]')).toBeTruthy();
    expect(f.nativeElement.querySelector('input[data-path="/a"]')).toBeFalsy();
  });

  it('emits an integer (not a string) from a number widget', () => {
    const f = mount({ type: 'object', properties: { size: { type: 'integer' } } });
    let emitted: any; f.componentInstance.changes.subscribe((d: any) => (emitted = d));
    const input: HTMLInputElement = f.nativeElement.querySelector('input[data-path="/size"]');
    input.value = '5'; input.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(emitted.size).toBe(5);                   // number, fixing the `"5"` regression
  });
});
