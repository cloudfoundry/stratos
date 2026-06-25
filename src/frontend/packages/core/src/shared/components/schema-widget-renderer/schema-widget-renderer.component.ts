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
import { classifyNode } from './schema-resolve.util';
import { JsonSchema, NodeKind } from './schema-node.model';

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

  ngOnInit(): void {
    this._seedAndBuild();
  }

  ngOnChanges(): void {
    this._seedAndBuild();
  }

  /** Re-seed the working copy from @Input() data and rebuild the field list. */
  private _seedAndBuild(): void {
    this._working.set(structuredClone(this.data ?? {}));
    this.fields.set(this._buildFields());
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
