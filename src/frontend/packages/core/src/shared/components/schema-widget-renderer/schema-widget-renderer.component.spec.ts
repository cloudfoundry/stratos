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

  it('emits an integer (not a string) from a number widget', () => {
    const f = mount({ type: 'object', properties: { size: { type: 'integer' } } });
    let emitted: any; f.componentInstance.changes.subscribe((d: any) => (emitted = d));
    const input: HTMLInputElement = f.nativeElement.querySelector('input[data-path="/size"]');
    input.value = '5'; input.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(emitted.size).toBe(5);                   // number, fixing the `"5"` regression
  });
});
