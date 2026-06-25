import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  forwardRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { classifyNode, mergeAllOf } from './schema-resolve.util';
import { JsonSchema, NodeKind, ResolvedNode } from './schema-node.model';

export interface FieldDescriptor {
  pointer: string;
  key: string;
  title: string;
  description?: string;
  required: boolean;
  kind: NodeKind;
  schema: JsonSchema;
}

@Component({
  selector: 'json-schema-form',
  standalone: true,
  imports: [CommonModule, forwardRef(() => SchemaWidgetRendererComponent)],
  templateUrl: './schema-widget-renderer.component.html',
})
export class SchemaWidgetRendererComponent implements OnInit, OnChanges {
  @Input() schema: JsonSchema = {};
  @Input() data: any = {};
  /** Back-compat inputs — accepted, not used by this renderer. */
  @Input() framework: any;
  @Input() options: any;
  @Input() loadExternalAssets: any;
  /**
   * Internal: JSON Pointer prefix for this subtree. Set by the parent when
   * recursing so child field pointers reflect the full path from the root
   * (e.g. "/network" → child "/network/cidr"). Not part of the public API.
   */
  @Input() _basePointer: string = '';

  /** Emits the full data object on every scalar/child edit. */
  @Output() changes = new EventEmitter<any>();

  /**
   * Emitted as [] on every edit — validity is advisory and surfaced by the
   * wrapper (SchemaFormComponent); kept here only for contract compatibility.
   */
  @Output() validationErrors = new EventEmitter<any[]>();

  /** Working copy of data — never mutate @Input() data directly. */
  private readonly _working = signal<any>({});

  /**
   * Rebuilt in ngOnInit/ngOnChanges (not a computed): `_buildFields` reads
   * plain @Input properties (schema, _basePointer), not signals, so a computed
   * would never recompute. Task 10 reassigns [schema] on the SAME instance
   * (service-plan switch) — rebuilding on input change keeps the form in sync.
   */
  readonly fields = signal<FieldDescriptor[]>([]);

  /**
   * Per-pointer active branch index for `oneOf` fields (default 0).
   * Keyed by the field's JSON Pointer (e.g. "/x").
   */
  private readonly _oneOfIndex = signal<Record<string, number>>({});

  /**
   * Per-pointer selected branch indices for `anyOf` fields (default []).
   * Keyed by the field's JSON Pointer (e.g. "/y").
   */
  private readonly _anyOfSelected = signal<Record<string, number[]>>({});

  /** Monotonic ID counter for stable map row tracking. */
  private _mapRowIdCounter = 0;

  /**
   * Per-pointer list of map editor rows. Each row has a stable `id` for
   * `@for` tracking so key/value inputs don't lose focus on re-render.
   * Keyed by the field's JSON Pointer (e.g. "/labels").
   */
  private readonly _mapRows = signal<Record<string, { id: number; key: string; value: any }[]>>({});

  ngOnInit(): void {
    this._seedAndBuild();
  }

  ngOnChanges(): void {
    this._seedAndBuild();
  }

  /** Re-seed the working copy from @Input() data and rebuild the field list. */
  private _seedAndBuild(): void {
    // m3: Task 10 reassigns [schema] on the same instance — clear branch state
    // so stale (possibly out-of-range) oneOf/anyOf selections don't carry over.
    this._oneOfIndex.set({});
    this._anyOfSelected.set({});
    this._mapRows.set({});
    this._mapRowIdCounter = 0;
    this._working.set(structuredClone(this.data ?? {}));
    this.fields.set(this._buildFields());
    this._seedMapRows();
  }

  /**
   * Seeds map rows from existing data for any `map`-kind fields. Called after
   * fields + working data are both set so we can look up initial values.
   */
  private _seedMapRows(): void {
    const rows: Record<string, { id: number; key: string; value: any }[]> = {};
    for (const field of this.fields()) {
      if (field.kind !== 'map') {
        continue;
      }
      const existing = this.valueAt(field.pointer);
      if (existing != null && typeof existing === 'object' && !Array.isArray(existing)) {
        rows[field.pointer] = Object.entries(existing).map(([k, v]) => ({
          id: ++this._mapRowIdCounter,
          key: k,
          value: v,
        }));
      } else {
        rows[field.pointer] = [];
      }
    }
    this._mapRows.set(rows);
  }

  valueAt(pointer: string): any {
    // Strip the base prefix so we look up into the local working-data slice.
    const localPointer = this._localPointer(pointer);
    const parts = this._pointerParts(localPointer);
    let node = this._working();
    for (const p of parts) {
      if (node == null || typeof node !== 'object') {
        return undefined;
      }
      node = node[p];
    }
    return node;
  }

  /** Called when a child object emits `changes`. Merges nested data back in. */
  onChild(pointer: string, childData: any): void {
    // pointer is the full path; strip base to get the local key
    const localPointer = this._localPointer(pointer);
    const parts = this._pointerParts(localPointer);
    const copy = structuredClone(this._working());
    let cursor = copy;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (cursor[p] == null || typeof cursor[p] !== 'object') {
        cursor[p] = {};
      }
      cursor = cursor[p];
    }
    cursor[parts[parts.length - 1]] = childData;
    this._working.set(copy);
    this.changes.emit(structuredClone(copy));
    this.validationErrors.emit([]);
  }

  /** Handles input/change events for scalar (string/number/enum) fields. */
  setScalar(field: FieldDescriptor, event: Event): void {
    const raw = (event.target as HTMLInputElement | HTMLSelectElement).value;
    let value: any;
    if (field.kind === 'number') {
      value = raw === '' ? undefined : Number(raw);
    } else {
      value = raw;
    }
    this._setAt(field.pointer, value);
  }

  /** Handles change events for boolean (checkbox) fields. */
  setBool(field: FieldDescriptor, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this._setAt(field.pointer, checked);
  }

  /** Returns the HTML input type for a scalar field. */
  inputType(field: FieldDescriptor): string {
    switch (field.kind) {
      case 'number': return 'number';
      case 'boolean': return 'checkbox';
      default: return 'text';
    }
  }

  /** Returns the current array at `pointer`, or []. */
  arrayAt(pointer: string): any[] {
    const val = this.valueAt(pointer);
    return Array.isArray(val) ? val : [];
  }

  /** Returns a sensible default item for the array field's item schema. */
  private _itemDefault(field: FieldDescriptor): any {
    const items = field.schema.items;
    if (!items || typeof items !== 'object' || Array.isArray(items)) {
      return '';
    }
    if (items.type === 'object' || items.properties) {
      return {};
    }
    return '';
  }

  /** Appends a new default item to the array at `pointer` and emits. */
  addItem(pointer: string, field: FieldDescriptor): void {
    const arr = [...this.arrayAt(pointer), this._itemDefault(field)];
    this._setAt(pointer, arr);
  }

  /** Removes the item at `index` from the array at `pointer` and emits. */
  removeItem(pointer: string, index: number): void {
    const arr = [...this.arrayAt(pointer)];
    arr.splice(index, 1);
    this._setAt(pointer, arr);
  }

  /**
   * Moves the item at `index` in direction `dir` (+1 = down, -1 = up).
   * No-ops if the move would go out of bounds.
   */
  moveItem(pointer: string, index: number, dir: 1 | -1): void {
    const arr = [...this.arrayAt(pointer)];
    const target = index + dir;
    if (target < 0 || target >= arr.length) {
      return;
    }
    [arr[index], arr[target]] = [arr[target], arr[index]];
    this._setAt(pointer, arr);
  }

  /** Returns the item pointer for a given array field pointer and index. */
  itemPointer(arrayPointer: string, index: number): string {
    return `${arrayPointer}/${index}`;
  }

  /** Returns the item schema for an array field (the `items` sub-schema). */
  itemSchema(field: FieldDescriptor): JsonSchema {
    return field.schema.items ?? {};
  }

  /** Returns whether the item schema for an array field is a scalar (non-object). */
  isScalarItem(field: FieldDescriptor): boolean {
    const items = field.schema.items;
    if (!items || typeof items !== 'object' || Array.isArray(items)) {
      return true;
    }
    return items.type !== 'object' && !items.properties;
  }

  /**
   * Handles input events for inline scalar array-item inputs.
   * `pointer` is the full item pointer (e.g. "/hosts/0"). Coerces numbers
   * with the same rule as `setScalar` so a `items: { type: number }` array
   * emits `[5]` rather than `["5"]`.
   */
  setArrayItemScalar(pointer: string, event: Event, itemSchema?: JsonSchema): void {
    const raw = (event.target as HTMLInputElement).value;
    const isNumber = itemSchema?.type === 'number' || itemSchema?.type === 'integer';
    this._setAt(pointer, isNumber ? (raw === '' ? undefined : Number(raw)) : raw);
  }

  /** Returns the HTML input type for a scalar array-item schema. */
  itemInputType(field: FieldDescriptor): string {
    const items = field.schema.items;
    if (!items || typeof items !== 'object' || Array.isArray(items)) {
      return 'text';
    }
    if (items.type === 'number' || items.type === 'integer') {
      return 'number';
    }
    if (items.type === 'string' && items.format === 'password') {
      return 'password';
    }
    return 'text';
  }

  /**
   * Toggles `option` in/out of the multiselect array at `pointer`.
   * Preserves order of existing values; appends when adding.
   */
  toggleMulti(pointer: string, option: any, checked: boolean): void {
    const current: any[] = this.arrayAt(pointer);
    let updated: any[];
    if (checked) {
      updated = current.includes(option) ? current : [...current, option];
    } else {
      updated = current.filter(v => v !== option);
    }
    this._setAt(pointer, updated);
  }

  /** Returns whether `option` is present in the multiselect array at `pointer`. */
  isMultiSelected(pointer: string, option: any): boolean {
    return this.arrayAt(pointer).includes(option);
  }

  // ---------------------------------------------------------------------------
  // Map editor (`additionalProperties` / `kind === 'map'`)
  // ---------------------------------------------------------------------------

  /** Returns the current rows for the map at `pointer`. */
  mapRows(pointer: string): { id: number; key: string; value: any }[] {
    return this._mapRows()[pointer] ?? [];
  }

  /** Adds a new empty row to the map at `pointer`. */
  addMapKey(pointer: string, field: FieldDescriptor): void {
    const valueDefault = this._mapValueDefault(field);
    const current = this._mapRows();
    const currentRows = current[pointer] ?? [];
    this._mapRows.set({
      ...current,
      [pointer]: [...currentRows, { id: ++this._mapRowIdCounter, key: '', value: valueDefault }],
    });
    // Don't emit yet — empty-key rows are excluded from the emitted object.
  }

  /** Updates the key of a row and rebuilds the map object. */
  setMapKey(pointer: string, id: number, newKey: string): void {
    this._updateMapRow(pointer, id, row => ({ ...row, key: newKey }));
  }

  /** Updates the value of a scalar row and rebuilds the map object. */
  setMapValue(pointer: string, id: number, event: Event, valueSchema?: JsonSchema): void {
    const raw = (event.target as HTMLInputElement).value;
    const isNumber = valueSchema?.type === 'number' || valueSchema?.type === 'integer';
    const value = isNumber ? (raw === '' ? undefined : Number(raw)) : raw;
    this._updateMapRow(pointer, id, row => ({ ...row, value }));
  }

  /** Removes a row from the map at `pointer` and rebuilds the object. */
  removeMapKey(pointer: string, id: number): void {
    const current = this._mapRows();
    const updated = (current[pointer] ?? []).filter(r => r.id !== id);
    this._mapRows.set({ ...current, [pointer]: updated });
    this._rebuildMap(pointer, updated);
  }

  /** Returns the `additionalProperties` sub-schema for a map field, or `{}`. */
  mapValueSchema(field: FieldDescriptor): JsonSchema {
    return (field.schema.additionalProperties as JsonSchema) ?? {};
  }

  /** Returns whether the `additionalProperties` value schema is scalar (non-object). */
  isScalarMapValue(field: FieldDescriptor): boolean {
    const ap = field.schema.additionalProperties;
    if (!ap || typeof ap !== 'object') {
      return true; // true / missing → treat as string
    }
    return (ap as JsonSchema).type !== 'object' && !(ap as JsonSchema).properties;
  }

  /** Returns the input type for an inline scalar map-value input. */
  mapValueInputType(field: FieldDescriptor): string {
    const ap = field.schema.additionalProperties;
    if (!ap || typeof ap !== 'object') {
      return 'text';
    }
    const type = (ap as JsonSchema).type;
    if (type === 'number' || type === 'integer') {
      return 'number';
    }
    return 'text';
  }

  private _mapValueDefault(field: FieldDescriptor): any {
    const ap = field.schema.additionalProperties;
    if (!ap || typeof ap !== 'object') {
      return '';
    }
    const type = (ap as JsonSchema).type;
    if (type === 'object' || (ap as JsonSchema).properties) {
      return {};
    }
    return '';
  }

  private _updateMapRow(
    pointer: string,
    id: number,
    updater: (row: { id: number; key: string; value: any }) => { id: number; key: string; value: any },
  ): void {
    const current = this._mapRows();
    const updated = (current[pointer] ?? []).map(r => r.id === id ? updater(r) : r);
    this._mapRows.set({ ...current, [pointer]: updated });
    this._rebuildMap(pointer, updated);
  }

  private _rebuildMap(pointer: string, rows: { id: number; key: string; value: any }[]): void {
    const obj = Object.fromEntries(
      rows.filter(r => r.key !== '').map(r => [r.key, r.value]),
    );
    this._setAt(pointer, obj);
  }

  // ---------------------------------------------------------------------------
  // Tuple arrays (`kind === 'tuple'`, items is an array of schemas)
  // ---------------------------------------------------------------------------

  /** Returns the tuple item schemas (items as array). */
  tupleSchemas(field: FieldDescriptor): JsonSchema[] {
    const items = field.schema.items;
    return Array.isArray(items) ? items : [];
  }

  /** Returns the HTML input type for a positional tuple item schema. */
  tupleItemInputType(itemSchema: JsonSchema): string {
    if (itemSchema.type === 'number' || itemSchema.type === 'integer') {
      return 'number';
    }
    return 'text';
  }

  /** Returns whether a positional tuple item schema is scalar (non-object). */
  isScalarTupleItem(itemSchema: JsonSchema): boolean {
    return itemSchema.type !== 'object' && !itemSchema.properties;
  }

  /**
   * Handles input for a positional scalar tuple item.
   * `arrayPointer` is the full pointer to the tuple field (e.g. "/pair"),
   * `index` is the position, and `itemSchema` drives coercion.
   * We write the whole array at once so the value stays an Array, not an object.
   */
  setTupleItemScalar(arrayPointer: string, index: number, event: Event, itemSchema: JsonSchema): void {
    const raw = (event.target as HTMLInputElement).value;
    const isNumber = itemSchema.type === 'number' || itemSchema.type === 'integer';
    const value = isNumber ? (raw === '' ? undefined : Number(raw)) : raw;
    const arr = [...(this.arrayAt(arrayPointer) as any[])];
    // Ensure the array is long enough for positional writes.
    while (arr.length <= index) {
      arr.push(undefined);
    }
    arr[index] = value;
    this._setAt(arrayPointer, arr);
  }

  // ---------------------------------------------------------------------------
  // oneOf / anyOf state
  // ---------------------------------------------------------------------------

  /** Returns the active branch index for a `oneOf` field. */
  activeOneOf(pointer: string): number {
    return this._oneOfIndex()[pointer] ?? 0;
  }

  /**
   * Switches the active branch for a `oneOf` field, clearing stale data at
   * the pointer so old branch fields don't leak into the new branch's value.
   */
  selectBranch(pointer: string, index: number): void {
    // m2: re-choosing the already-active branch must not wipe entered data.
    if (this.activeOneOf(pointer) === index) {
      return;
    }
    this._oneOfIndex.set({ ...this._oneOfIndex(), [pointer]: index });
    // Reset the data at this pointer to {} so prior branch data is cleared.
    this._setAt(pointer, {});
  }

  /**
   * Resolves the active `oneOf` branch sub-schema for a field, classified.
   * Used by the template to decide between an inline scalar widget and a
   * recursive `<json-schema-form>` child.
   */
  activeOneOfNode(field: FieldDescriptor): ResolvedNode {
    const branch = (field.schema.oneOf ?? [])[this.activeOneOf(field.pointer)] ?? {};
    return classifyNode(branch, this.schema ?? {});
  }

  /**
   * Whether a classified branch kind is a scalar that should render inline
   * at the field pointer (rather than recursing into a child object form).
   */
  isScalarBranch(kind: NodeKind): boolean {
    return kind === 'string' || kind === 'number' || kind === 'boolean' || kind === 'enum';
  }

  /**
   * Handles input/change for an inline scalar `oneOf` branch at `pointer`.
   * Coerces numbers the same way `setScalar` does so a number branch emits
   * `5` rather than `"5"`.
   */
  setBranchScalar(pointer: string, kind: NodeKind, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (kind === 'boolean') {
      this._setAt(pointer, target.checked);
      return;
    }
    const raw = target.value;
    this._setAt(pointer, kind === 'number' ? (raw === '' ? undefined : Number(raw)) : raw);
  }

  /** HTML input type for an inline scalar `oneOf` branch kind. */
  branchInputType(kind: NodeKind): string {
    switch (kind) {
      case 'number': return 'number';
      case 'boolean': return 'checkbox';
      default: return 'text';
    }
  }

  /** Returns the selected branch indices for an `anyOf` field. */
  selectedAnyOf(pointer: string): number[] {
    return this._anyOfSelected()[pointer] ?? [];
  }

  /**
   * Toggles a branch in/out of the selected set for an `anyOf` field.
   * I1: on deselect, deletes from the working data any keys that belong only
   * to the deselected branch (not present in any still-selected branch), so
   * stale values don't get emitted/POSTed.
   */
  toggleAnyOf(pointer: string, index: number, checked: boolean, branches?: JsonSchema[]): void {
    const current = this.selectedAnyOf(pointer);
    const updated = checked
      ? current.includes(index) ? current : [...current, index]
      : current.filter(i => i !== index);
    this._anyOfSelected.set({ ...this._anyOfSelected(), [pointer]: updated });

    if (!checked && branches) {
      this._pruneAnyOfKeys(pointer, branches, index, updated);
    }
  }

  /**
   * Removes from the working data the keys exclusive to the deselected branch
   * (in its `properties` but not in any still-selected branch's `properties`).
   */
  private _pruneAnyOfKeys(
    pointer: string,
    branches: JsonSchema[],
    deselectedIndex: number,
    stillSelected: number[],
  ): void {
    const root = this.schema ?? {};
    const deselectedProps = classifyNode(branches[deselectedIndex] ?? {}, root).schema.properties ?? {};
    const deselectedKeys = Object.keys(deselectedProps);
    if (deselectedKeys.length === 0) {
      return;
    }
    const keptKeys = new Set<string>();
    for (const i of stillSelected) {
      const props = classifyNode(branches[i] ?? {}, root).schema.properties ?? {};
      for (const k of Object.keys(props)) {
        keptKeys.add(k);
      }
    }
    const exclusiveKeys = deselectedKeys.filter(k => !keptKeys.has(k));
    if (exclusiveKeys.length === 0) {
      return;
    }
    const currentVal = this.valueAt(pointer);
    if (currentVal == null || typeof currentVal !== 'object') {
      return;
    }
    const next = { ...currentVal };
    for (const k of exclusiveKeys) {
      delete next[k];
    }
    this._setAt(pointer, next);
  }

  /**
   * Returns the merged schema for the currently selected `anyOf` branches.
   * Uses `mergeAllOf` by wrapping selected sub-schemas as `allOf`.
   */
  mergedAnyOf(pointer: string, branches: JsonSchema[]): JsonSchema {
    const selected = this.selectedAnyOf(pointer);
    if (selected.length === 0) {
      return {};
    }
    const selectedBranches = selected.map(i => branches[i]).filter(Boolean);
    if (selectedBranches.length === 1) {
      return selectedBranches[0];
    }
    return mergeAllOf({ allOf: selectedBranches }, this.schema ?? {});
  }

  /** Returns a display label for a branch schema (title or fallback). */
  branchLabel(branch: JsonSchema, index: number): string {
    return branch.title ?? `Option ${index + 1}`;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _buildFields(): FieldDescriptor[] {
    const schema = this.schema ?? {};
    const root = schema;
    const resolved = classifyNode(schema, root);

    if (resolved.kind !== 'object' || !resolved.schema.properties) {
      return [];
    }

    const props = resolved.schema.properties as Record<string, JsonSchema>;
    const requiredSet = new Set<string>(resolved.schema.required ?? []);

    return Object.entries(props).map(([key, propSchema]) => {
      const childResolved = classifyNode(propSchema, root);
      const pointer = `${this._basePointer}/${key}`;
      return {
        pointer,
        key,
        title: childResolved.title ?? propSchema.title ?? key,
        description: childResolved.description ?? propSchema.description,
        required: requiredSet.has(key),
        kind: childResolved.kind,
        schema: childResolved.schema,
      };
    });
  }

  /**
   * Writes `value` into the working data at the given JSON Pointer,
   * creating intermediate objects as needed, then emits.
   * The pointer is the full path; strip the base prefix before writing locally.
   */
  private _setAt(pointer: string, value: any): void {
    const localPointer = this._localPointer(pointer);
    const parts = this._pointerParts(localPointer);
    const copy = structuredClone(this._working());
    let cursor = copy;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (cursor[p] == null || typeof cursor[p] !== 'object') {
        cursor[p] = {};
      }
      cursor = cursor[p];
    }
    cursor[parts[parts.length - 1]] = value;
    this._working.set(copy);
    this.changes.emit(structuredClone(copy));
    this.validationErrors.emit([]);
  }

  /** Splits a JSON Pointer ("/a/b/c") into parts ["a","b","c"]. */
  private _pointerParts(pointer: string): string[] {
    return pointer.replace(/^\//, '').split('/').filter(p => p !== '');
  }

  /**
   * Strips the `_basePointer` prefix from a full pointer to get the
   * pointer relative to this component's own working-data slice.
   */
  private _localPointer(pointer: string): string {
    if (this._basePointer && pointer.startsWith(this._basePointer)) {
      return pointer.slice(this._basePointer.length) || '/';
    }
    return pointer;
  }
}
