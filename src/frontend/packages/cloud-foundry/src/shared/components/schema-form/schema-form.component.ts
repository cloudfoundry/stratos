
import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, Output, computed, inject, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MonacoEditorComponent,
  MonacoEditorOptions,
  TailwindSnackBarService,
  safeStringToObj,
} from '@stratosui/core';
import { SchemaWidgetRendererComponent } from '../../../../../core/src/shared/components/schema-widget-renderer/schema-widget-renderer.component';
import { validateAgainstSchema, SchemaWarning } from '../../../../../core/src/shared/components/schema-widget-renderer/schema-validate.util';
import { schemaToSkeleton, stripEmpty, mergeSkeleton } from '../../../../../core/src/shared/components/schema-widget-renderer/schema-resolve.util';

export interface SchemaFormValidationError {
  dataPath: Record<string, unknown>;
  message: string;
}

export class SchemaFormConfig {
  // Optional: the broker may not supply a schema for the plan — the form
  // then falls back to the raw JSON editor (see the `config` setter).
  schema?: object;
  initialData?: object;
}

@Component({
  selector: 'app-schema-form',
  templateUrl: './schema-form.component.html',
  styleUrls: ['./schema-form.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    SchemaWidgetRendererComponent,
    MonacoEditorComponent,
  ],
})
export class SchemaFormComponent {

  mode!: 'JSON' | 'schema';
  readonly schemaView = signal<'schemaForm' | 'schemaJson'>('schemaForm');
  readonly renderError = signal<string | null>(null);
  private readonly snackBar = inject(TailwindSnackBarService);
  private schema: object | undefined;

  @Input()
  set config(config: SchemaFormConfig | undefined) {
    // Skip if no config... or schema is the same (avoids losing existing data in form)
    if (!config || (config.schema && config.schema === this.schema)) {
      return;
    }
    this.schema = config.schema;
    this.cleanSchema = this.filterSchema(config.schema);
    this.mode = this.cleanSchema ? 'schema' : 'JSON';
    if (this.mode === 'JSON') {
      this.setJsonText(config.initialData ? JSON.stringify(config.initialData) : '');
      if (!config.initialData) {
        this.parseValid.set(true);
      }
    } else if (this.mode === 'schema') {
      this.formInitialData = config.initialData;
    }
  }

  @Output() dataChange = new EventEmitter<object | null>();
  @Output() validChange = new EventEmitter<boolean>();

  readonly data = signal<object | null>(null);
  readonly parseValid = signal<boolean>(true);   // the ONLY submission gate
  readonly warnings = signal<SchemaWarning[]>([]);
  jsonText = '';

  // Compact JSON editor: no minimap / overview ruler / line-highlight chrome —
  // the params box holds a few lines of JSON, not a code file.
  readonly monacoOptions: MonacoEditorOptions = {
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    tabSize: 2,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    renderLineHighlight: 'none',
  };

  cleanSchema: object | null | undefined;
  formInitialData: object | null | undefined;

  get schemaTitle(): string | undefined {
    return (this.cleanSchema as any)?.title as string | undefined;
  }

  get schemaDescription(): string | undefined {
    return (this.cleanSchema as any)?.description as string | undefined;
  }

  private _destroyed = false;
  private _jsonEditor: any = null;
  // Signal mirror of jsonText (a plain field) so the Format/Minify button
  // state tracks edits reactively.
  private _jsonTextSig = signal('');

  /** Format/Minify only offered when the text parses — reformatting
   *  non-JSON makes no sense. Empty text never parses, so the button is
   *  disabled on an untouched editor. */
  readonly canFormat = computed(() => {
    try {
      JSON.parse(this._jsonTextSig());
      return true;
    } catch {
      return false;
    }
  });

  /** Whether the text is canonical-minified JSON — drives the
   *  Format <-> Minify toggle's label and direction. */
  readonly isMinified = computed(() => {
    try {
      const t = this._jsonTextSig();
      return t === JSON.stringify(JSON.parse(t));
    } catch {
      return false;
    }
  });

  /** Toggle the editor text between pretty-printed (2-space) and canonical
   *  minified JSON. Pure editing aid — submission always sends the parsed
   *  object, so this never changes what is sent. No-op on invalid JSON. */
  toggleFormat(): void {
    try {
      const parsed = JSON.parse(this.jsonText);
      const minified = JSON.stringify(parsed);
      const next = this.jsonText === minified ? JSON.stringify(parsed, null, 2) : minified;
      this.setJsonText(next);
      if (this._jsonEditor && this._jsonEditor.getValue() !== next) {
        this._jsonEditor.setValue(next);
      }
    } catch {
      // Invalid JSON — the button is disabled, nothing to do.
    }
  }

  constructor() {
    effect(() => this.dataChange.emit(this.data()));
    effect(() => this.validChange.emit(this.parseValid()));
    inject(DestroyRef).onDestroy(() => { this._destroyed = true; });
  }

  /** Called by the Monaco JSON view (and tests) when JSON text changes. */
  setJsonText(text: string) {
    this.jsonText = text;
    this._jsonTextSig.set(text);
    const obj = safeStringToObj(text);          // null when unparseable
    const parsed = text.trim() === '' || obj !== null;
    this.parseValid.set(parsed);
    if (parsed) {
      // Strip unset values so an untouched key-skeleton submits no params; the
      // editor still shows the full skeleton (jsonText), only `data` is cleaned.
      const cleaned = stripEmpty(obj) as object | undefined;
      this.data.set(cleaned ?? null);
      this.warnings.set(validateAgainstSchema(this.cleanSchema ?? undefined, cleaned ?? {})); // advisory only
    } else {
      this.warnings.set([]);                     // syntax error shown by editor itself
    }
  }

  /** Form-view (`<json-schema-form>`) data changes — also advisory-validated. */
  onFormChange(formData: object) {
    const cleaned = stripEmpty(formData) as object | undefined;
    this.data.set(cleaned ?? null);
    this.parseValid.set(true);                   // widget data is always a valid object
    this.warnings.set(validateAgainstSchema(this.cleanSchema ?? undefined, cleaned ?? {}));
  }

  onSchemaViewChanged() {
    if (this.schemaView() === 'schemaForm') {
      this.formInitialData = this.data() ?? undefined; // JSON → form
    } else {
      // form → JSON. Always show the full schema skeleton with the user's current
      // values overlaid, so every field is visible (set ones filled, the rest empty
      // placeholders). The empty placeholders strip back out on submit via
      // setJsonText/stripEmpty, so an untouched field shows but is not sent.
      const seed = this.cleanSchema
        ? mergeSkeleton(schemaToSkeleton(this.cleanSchema), this.data())
        : this.data();
      this.setJsonText(seed != null ? JSON.stringify(seed, null, 2) : '');
      // Push the updated text into a mounted editor so it shows immediately.
      // Guard against the onDidChangeModelContent feedback loop: only setValue
      // when the editor does not already hold the correct value.
      if (this._jsonEditor && this._jsonEditor.getValue() !== this.jsonText) {
        this._jsonEditor.setValue(this.jsonText);
      }
    }
  }

  /** Called by the renderer's `(renderError)` output. Deferred via queueMicrotask
   *  to avoid re-entrancy when the emit arrives mid change-detection (during child ngOnInit). */
  onRenderError(message: string): void {
    queueMicrotask(() => {
      if (this._destroyed) { return; }   // view torn down before the deferred callback ran
      this.renderError.set(message);
      // Seed the JSON editor with any existing data before switching views,
      // so pre-filled parameters are not lost when the form fails to render.
      if (!this.jsonText) {
        const d = this.data() ?? this.formInitialData;
        if (d != null) {
          this.setJsonText(JSON.stringify(d, null, 2));
        }
      }
      this.schemaView.set('schemaJson');   // auto-fallback to JSON view
      this.snackBar.error(message);
    });
  }

  onMonacoInit(editor: any) {
    this._jsonEditor = editor;
    // Seed the editor with the current text: the [model].value binding is read-once
    // at construction, so a freshly-mounted editor may be stale if jsonText was
    // written after the previous view was destroyed (e.g. Form→JSON toggle).
    if (editor.getValue() !== this.jsonText) {
      editor.setValue(this.jsonText);
    }
    editor.onDidChangeModelContent(() => this.setJsonText(editor.getValue()));
    // advisory squiggles; we never gate on these — only on parseValid
    (window as any).monaco?.languages?.json?.jsonDefaults?.setDiagnosticsOptions({
      validate: true,
      schemas: this.cleanSchema
        ? [{ uri: 'inmemory://plan-schema.json', fileMatch: ['*'], schema: this.cleanSchema }]
        : [],
    });
  }

  private filterSchema = (schema?: { [key: string]: any }): { [key: string]: any } | null | undefined => {
    if (!schema) {
      return;
    }
    const filterSchema = Object.keys(schema).reduce((obj: { [key: string]: any }, key) => {
      if (key !== '$schema') { obj[key] = schema[key]; }
      return obj;
    }, {});
    return Object.keys(filterSchema).length > 0 ? filterSchema : null;
  };

}
