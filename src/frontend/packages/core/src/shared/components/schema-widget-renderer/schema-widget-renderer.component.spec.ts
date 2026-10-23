import { describe, it, expect } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SchemaWidgetRendererComponent } from './schema-widget-renderer.component';

async function mount(schema: any, data: any = {}) {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const f = TestBed.createComponent(SchemaWidgetRendererComponent);
  f.componentRef.setInput('schema', schema);
  f.componentRef.setInput('data', data);
  await f.whenStable();
  return f;
}

describe('SchemaWidgetRenderer array + multiselect', () => {
  it('array add/remove emits array data', async () => {
    const f = await mount({ type: 'object', properties: { hosts: { type: 'array', items: { type: 'string' } } } });
    let emitted: any; f.componentInstance.changes.subscribe((d: any) => (emitted = d));
    f.nativeElement.querySelector('button[data-add="/hosts"]').click(); await f.whenStable();
    const input = f.nativeElement.querySelector('input[data-path="/hosts/0"]');
    input.value = 'h1'; input.dispatchEvent(new Event('input')); await f.whenStable();
    expect(emitted.hosts).toEqual(['h1']);
  });

  it('emits integers (not strings) from a number-typed array item', async () => {
    const f = await mount({ type: 'object', properties: { nums: { type: 'array', items: { type: 'integer' } } } });
    let emitted: any; f.componentInstance.changes.subscribe((d: any) => (emitted = d));
    f.nativeElement.querySelector('button[data-add="/nums"]').click(); await f.whenStable();
    const input = f.nativeElement.querySelector('input[data-path="/nums/0"]');
    input.value = '5'; input.dispatchEvent(new Event('input')); await f.whenStable();
    expect(emitted.nums).toEqual([5]);
  });

  it('renders a uniqueItems enum array as a multi-select checkbox group', async () => {
    const f = await mount({ type: 'object', properties: {
      zones: { type: 'array', uniqueItems: true, items: { enum: ['a', 'b', 'c'] } },
    } });
    let emitted: any; f.componentInstance.changes.subscribe((d: any) => (emitted = d));
    const cb = f.nativeElement.querySelector('input[type=checkbox][data-multi="/zones"][value="b"]');
    cb.checked = true; cb.dispatchEvent(new Event('change')); await f.whenStable();
    expect(emitted.zones).toEqual(['b']);
  });
});

describe('SchemaWidgetRenderer oneOf/anyOf branch selectors', () => {
  it('oneOf renders a branch selector and emits data shaped by the chosen branch', async () => {
    const f = await mount({ type:'object', properties:{ x:{ oneOf:[
      { type:'object', title:'A', properties:{ a:{ type:'string' } } },
      { type:'object', title:'B', properties:{ b:{ type:'number' } } },
    ] } } });
    let emitted:any; f.componentInstance.changes.subscribe((d:any)=>emitted=d);
    const sel:HTMLSelectElement = f.nativeElement.querySelector('select[data-branch="/x"]');
    expect(sel).toBeTruthy();                       // branch selector present
    sel.value = '1'; sel.dispatchEvent(new Event('change')); await f.whenStable(); // choose branch B
    const input:HTMLInputElement = f.nativeElement.querySelector('input[data-path="/x/b"]');
    expect(input).toBeTruthy();                     // chosen branch's fields render
    input.value = '5'; input.dispatchEvent(new Event('input')); await f.whenStable();
    expect(emitted.x.b).toBe(5);                    // emits data shaped by branch B (number)
  });

  it('anyOf renders checkboxes and renders all selected branches', async () => {
    const f = await mount({ type:'object', properties:{ y:{ anyOf:[
      { type:'object', properties:{ a:{ type:'string' } } },
      { type:'object', properties:{ b:{ type:'string' } } },
    ] } } });
    const boxes = f.nativeElement.querySelectorAll('input[type=checkbox][data-anyof="/y"]');
    expect(boxes.length).toBe(2);
    boxes[0].checked = true; boxes[0].dispatchEvent(new Event('change')); await f.whenStable();
    boxes[1].checked = true; boxes[1].dispatchEvent(new Event('change')); await f.whenStable();
    expect(f.nativeElement.querySelector('input[data-path="/y/a"]')).toBeTruthy();
    expect(f.nativeElement.querySelector('input[data-path="/y/b"]')).toBeTruthy();
  });

  it('oneOf with scalar branches renders an inline control and emits the scalar (C1)', async () => {
    const f = await mount({ type:'object', properties:{ x:{ oneOf:[
      { type:'string' },
      { type:'number' },
    ] } } });
    let emitted:any; f.componentInstance.changes.subscribe((d:any)=>emitted=d);
    // branch 0 (string) is active by default
    const sInput:HTMLInputElement = f.nativeElement.querySelector('input[data-path="/x"]');
    expect(sInput).toBeTruthy();
    sInput.value = 'hello'; sInput.dispatchEvent(new Event('input')); await f.whenStable();
    expect(emitted.x).toBe('hello');                // string branch
    // switch to branch 1 (number)
    const sel:HTMLSelectElement = f.nativeElement.querySelector('select[data-branch="/x"]');
    sel.value = '1'; sel.dispatchEvent(new Event('change')); await f.whenStable();
    const nInput:HTMLInputElement = f.nativeElement.querySelector('input[data-path="/x"]');
    expect(nInput).toBeTruthy();
    nInput.value = '5'; nInput.dispatchEvent(new Event('input')); await f.whenStable();
    expect(emitted.x).toBe(5);                       // number branch
  });

  it('anyOf deselect removes that branch\'s exclusive keys (I1)', async () => {
    const f = await mount({ type:'object', properties:{ y:{ anyOf:[
      { type:'object', properties:{ a:{ type:'string' } } },
      { type:'object', properties:{ b:{ type:'string' } } },
    ] } } });
    let emitted:any; f.componentInstance.changes.subscribe((d:any)=>emitted=d);
    const boxes = f.nativeElement.querySelectorAll('input[type=checkbox][data-anyof="/y"]');
    boxes[0].checked = true; boxes[0].dispatchEvent(new Event('change')); await f.whenStable();
    boxes[1].checked = true; boxes[1].dispatchEvent(new Event('change')); await f.whenStable();
    const aIn:HTMLInputElement = f.nativeElement.querySelector('input[data-path="/y/a"]');
    aIn.value = 'A'; aIn.dispatchEvent(new Event('input')); await f.whenStable();
    const bIn:HTMLInputElement = f.nativeElement.querySelector('input[data-path="/y/b"]');
    bIn.value = 'B'; bIn.dispatchEvent(new Event('input')); await f.whenStable();
    // deselect branch 0
    boxes[0].checked = false; boxes[0].dispatchEvent(new Event('change')); await f.whenStable();
    expect(emitted.y.a).toBeUndefined();             // exclusive key removed
    expect(emitted.y.b).toBe('B');                   // still-selected key kept
  });

  it('enum select reflects the seeded data value (selected option, not blank) (I2)', async () => {
    const f = await mount({ type:'object', properties:{ tier:{ enum:['bronze','gold'] } } }, { tier:'gold' });
    const sel:HTMLSelectElement = f.nativeElement.querySelector('select[data-path="/tier"]');
    expect(sel.value).toBe('gold');                  // selection reflects data (was blank w/ [value])
  });

  it('re-selecting the same oneOf branch keeps entered data (m2)', async () => {
    const f = await mount({ type:'object', properties:{ x:{ oneOf:[
      { type:'object', title:'A', properties:{ a:{ type:'string' } } },
      { type:'object', title:'B', properties:{ b:{ type:'number' } } },
    ] } } });
    let emitted:any; f.componentInstance.changes.subscribe((d:any)=>emitted=d);
    const aIn:HTMLInputElement = f.nativeElement.querySelector('input[data-path="/x/a"]');
    aIn.value = 'keep'; aIn.dispatchEvent(new Event('input')); await f.whenStable();
    // re-select the already-active branch 0
    const sel:HTMLSelectElement = f.nativeElement.querySelector('select[data-branch="/x"]');
    sel.value = '0'; sel.dispatchEvent(new Event('change')); await f.whenStable();
    expect(emitted.x.a).toBe('keep');                // not wiped
  });

  it('clears branch state when schema is reassigned on the same instance (m3)', async () => {
    const f = await mount({ type:'object', properties:{ x:{ oneOf:[
      { type:'object', title:'A', properties:{ a:{ type:'string' } } },
      { type:'object', title:'B', properties:{ b:{ type:'number' } } },
    ] } } });
    // select branch 1 on the first schema
    const sel:HTMLSelectElement = f.nativeElement.querySelector('select[data-branch="/x"]');
    sel.value = '1'; sel.dispatchEvent(new Event('change')); await f.whenStable();
    // reassign schema — same instance, oneOf with only ONE branch (index 1 now out of range)
    f.componentRef.setInput('schema', { type:'object', properties:{ x:{ oneOf:[
      { type:'object', title:'Only', properties:{ z:{ type:'string' } } },
    ] } } });
    f.componentInstance.ngOnChanges();
    await f.whenStable();
    // branch index reset to 0 → the single branch renders
    expect(f.nativeElement.querySelector('input[data-path="/x/z"]')).toBeTruthy();
  });
});

describe('SchemaWidgetRenderer map editor + tuple', () => {
  it('map editor (additionalProperties) adds key/value and emits the map', async () => {
    const f = await mount({ type:'object', properties:{ labels:{ type:'object', additionalProperties:{ type:'string' } } } });
    let emitted:any; f.componentInstance.changes.subscribe((d:any)=>emitted=d);
    f.nativeElement.querySelector('button[data-map-add="/labels"]').click(); await f.whenStable();
    const keyInput:HTMLInputElement = f.nativeElement.querySelector('input[data-map-key="/labels"]');
    const valInput:HTMLInputElement = f.nativeElement.querySelector('input[data-map-value="/labels"]');
    keyInput.value='foo'; keyInput.dispatchEvent(new Event('input')); await f.whenStable();
    valInput.value='bar'; valInput.dispatchEvent(new Event('input')); await f.whenStable();
    expect(emitted.labels).toEqual({ foo:'bar' });
  });

  it('object-valued map recurses and emits nested child data (not {})', async () => {
    const f = await mount({ type:'object', properties:{ creds:{ type:'object',
      additionalProperties:{ type:'object', properties:{ host:{ type:'string' } } } } } });
    let emitted:any; f.componentInstance.changes.subscribe((d:any)=>emitted=d);
    f.nativeElement.querySelector('button[data-map-add="/creds"]').click(); await f.whenStable();
    const keyInput:HTMLInputElement = f.nativeElement.querySelector('input[data-map-key="/creds"]');
    keyInput.value='db'; keyInput.dispatchEvent(new Event('input')); await f.whenStable();
    const hostInput:HTMLInputElement = f.nativeElement.querySelector('input[data-path$="/host"]');
    expect(hostInput).toBeTruthy();
    hostInput.value='localhost'; hostInput.dispatchEvent(new Event('input')); await f.whenStable();
    expect(emitted.creds.db.host).toBe('localhost');
  });

  it('renaming a map key moves the value under the new key and drops the old', async () => {
    const f = await mount({ type:'object', properties:{ labels:{ type:'object', additionalProperties:{ type:'string' } } } });
    let emitted:any; f.componentInstance.changes.subscribe((d:any)=>emitted=d);
    f.nativeElement.querySelector('button[data-map-add="/labels"]').click(); await f.whenStable();
    const keyInput:HTMLInputElement = f.nativeElement.querySelector('input[data-map-key="/labels"]');
    const valInput:HTMLInputElement = f.nativeElement.querySelector('input[data-map-value="/labels"]');
    keyInput.value='foo'; keyInput.dispatchEvent(new Event('input')); await f.whenStable();
    valInput.value='bar'; valInput.dispatchEvent(new Event('input')); await f.whenStable();
    expect(emitted.labels).toEqual({ foo:'bar' });
    keyInput.value='baz'; keyInput.dispatchEvent(new Event('input')); await f.whenStable();
    expect(emitted.labels).toEqual({ baz:'bar' });
    expect(emitted.labels.foo).toBeUndefined();
  });

  it('tuple array renders one positional widget per item schema and emits a positional array', async () => {
    const f = await mount({ type:'object', properties:{ pair:{ type:'array', items:[{type:'string'},{type:'integer'}] } } });
    let emitted:any; f.componentInstance.changes.subscribe((d:any)=>emitted=d);
    const a:HTMLInputElement = f.nativeElement.querySelector('input[data-path="/pair/0"]');
    const b:HTMLInputElement = f.nativeElement.querySelector('input[data-path="/pair/1"]');
    expect(a && b).toBeTruthy();
    a.value='x'; a.dispatchEvent(new Event('input')); await f.whenStable();
    b.value='5'; b.dispatchEvent(new Event('input')); await f.whenStable();
    expect(emitted.pair).toEqual(['x', 5]);
  });
});

describe('SchemaWidgetRenderer unknown fallback + warning highlight', () => {
  it('renders an unknown node as a JSON fallback editor and round-trips verbatim', async () => {
    const f = await mount({ type:'object', properties:{ weird:{ not:{} } } });  // classifyNode → 'unknown'
    let emitted:any; f.componentInstance.changes.subscribe((d:any)=>emitted=d);
    const ta:HTMLTextAreaElement = f.nativeElement.querySelector('textarea[data-json="/weird"]');
    expect(ta).toBeTruthy();
    ta.value='{"a":1}'; ta.dispatchEvent(new Event('input')); await f.whenStable();
    expect(emitted.weird).toEqual({ a:1 });
    // verbatim: the displayed text is NOT re-pretty-printed after a valid keystroke
    expect(ta.value).toBe('{"a":1}');
  });

  it('holds invalid JSON text without emitting and keeps last valid value', async () => {
    const f = await mount({ type:'object', properties:{ weird:{ not:{} } } });
    let emitted:any; let count=0;
    f.componentInstance.changes.subscribe((d:any)=>{ emitted=d; count++; });
    const ta:HTMLTextAreaElement = f.nativeElement.querySelector('textarea[data-json="/weird"]');
    ta.value='{"a":1}'; ta.dispatchEvent(new Event('input')); await f.whenStable();
    expect(emitted.weird).toEqual({ a:1 });
    const validEmits = count;
    ta.value='{"a":'; ta.dispatchEvent(new Event('input')); await f.whenStable();  // invalid
    expect(count).toBe(validEmits);          // no new emit on invalid
    expect(ta.value).toBe('{"a":');          // raw text held verbatim
  });

  it('marks a field whose pointer matches an advisory warning', async () => {
    const f = await mount({ type:'object', properties:{ size:{ type:'integer' } } });
    f.componentRef.setInput('warnings', [{ path:'/size', message:'must be integer' }]);
    await f.whenStable();
    const input:HTMLInputElement = f.nativeElement.querySelector('input[data-path="/size"]');
    expect(input.classList.contains('border-warning-400')).toBe(true);
  });

  it('marks an unknown fallback textarea whose pointer matches a warning', async () => {
    const f = await mount({ type:'object', properties:{ weird:{ not:{} } } });
    f.componentRef.setInput('warnings', [{ path:'/weird', message:'invalid' }]);
    await f.whenStable();
    const ta:HTMLTextAreaElement = f.nativeElement.querySelector('textarea[data-json="/weird"]');
    expect(ta.classList.contains('border-warning-400')).toBe(true);
  });
});

describe('SchemaWidgetRenderer object/scalar/enum', () => {
  it('renders a nested object as nested inputs and emits nested data', async () => {
    const schema = { type: 'object', properties: {
      network: { type: 'object', properties: { cidr: { type: 'string' } } },
    } };
    const f = await mount(schema);
    let emitted: any;
    f.componentInstance.changes.subscribe((d: any) => (emitted = d));
    const input: HTMLInputElement = f.nativeElement.querySelector('input[data-path="/network/cidr"]');
    expect(input).toBeTruthy();                     // nesting rendered (was lost)
    input.value = '10.0.0.0/8'; input.dispatchEvent(new Event('input'));
    await f.whenStable();
    expect(emitted.network.cidr).toBe('10.0.0.0/8'); // nested write
  });

  it('renders enum as a select', async () => {
    const f = await mount({ type: 'object', properties: { tier: { enum: ['bronze', 'gold'] } } });
    expect(f.nativeElement.querySelector('select[data-path="/tier"]')).toBeTruthy();
  });

  it('re-renders fields when the schema input is reassigned on the same instance', async () => {
    const schemaA = { type: 'object', properties: { a: { type: 'string' } } };
    const schemaB = { type: 'object', properties: { b: { type: 'string' } } };
    const f = await mount(schemaA);
    expect(f.nativeElement.querySelector('input[data-path="/a"]')).toBeTruthy();
    // Task 10: selecting a different service plan reassigns [schema] on the SAME
    // instance — fields must rebuild so the form reflects the new schema.
    f.componentRef.setInput('schema', schemaB);
    f.componentInstance.ngOnChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('input[data-path="/b"]')).toBeTruthy();
    expect(f.nativeElement.querySelector('input[data-path="/a"]')).toBeFalsy();
  });

  it('emits an integer (not a string) from a number widget', async () => {
    const f = await mount({ type: 'object', properties: { size: { type: 'integer' } } });
    let emitted: any; f.componentInstance.changes.subscribe((d: any) => (emitted = d));
    const input: HTMLInputElement = f.nativeElement.querySelector('input[data-path="/size"]');
    input.value = '5'; input.dispatchEvent(new Event('input'));
    await f.whenStable();
    expect(emitted.size).toBe(5);                   // number, fixing the `"5"` regression
  });
});

describe('SchemaWidgetRenderer string format input types', () => {
  it('renders format:password as type=password input', async () => {
    const f = await mount({ type: 'object', properties: { pw: { type: 'string', format: 'password' } } });
    const input: HTMLInputElement = f.nativeElement.querySelector('input[data-path="/pw"]');
    expect(input).toBeTruthy();
    expect(input.type).toBe('password');
  });
});

describe('SchemaWidgetRenderer render error fallback', () => {
  it('emits renderError and leaves fields empty when _buildFields throws', async () => {
    const evil: any = { type: 'object' };
    Object.defineProperty(evil, 'properties', { get() { throw new Error('boom'); }, enumerable: true });
    const f = await mount(evil);
    let err = '';
    f.componentInstance.renderError.subscribe((m: string) => (err = m));
    // re-run build so the subscription is in place before the emit
    f.componentInstance.ngOnChanges();
    await f.whenStable();
    expect(f.componentInstance.fields()).toEqual([]);
    expect(err).toContain('Edit the parameters directly as JSON');
  });
});
