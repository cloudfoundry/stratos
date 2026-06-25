
import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, Output, inject, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MonacoEditorComponent,
  TailwindSnackBarService,
  safeStringToObj,
} from '@stratosui/core';
import { SchemaWidgetRendererComponent } from '../../../../../core/src/shared/components/schema-widget-renderer/schema-widget-renderer.component';
import { validateAgainstSchema, SchemaWarning } from '../../../../../core/src/shared/components/schema-widget-renderer/schema-validate.util';

export interface SchemaFormValidationError {
  dataPath: Record<string, unknown>;
  message: string;
}

export class SchemaFormConfig {
  // strict: always supplied by callers building a config
  schema!: object;
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
  set config(config: SchemaFormConfig) {
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

  cleanSchema: object | null | undefined;
  formInitialData: object | null | undefined;

  private _destroyed = false;

  constructor() {
    effect(() => this.dataChange.emit(this.data()));
    effect(() => this.validChange.emit(this.parseValid()));
    inject(DestroyRef).onDestroy(() => { this._destroyed = true; });
  }

  /** Called by the Monaco JSON view (and tests) when JSON text changes. */
  setJsonText(text: string) {
    this.jsonText = text;
    const obj = safeStringToObj(text);          // null when unparseable
    const parsed = text.trim() === '' || obj !== null;
    this.parseValid.set(parsed);
    if (parsed) {
      this.data.set(obj);
      this.warnings.set(validateAgainstSchema(this.cleanSchema ?? undefined, obj)); // advisory only
    } else {
      this.warnings.set([]);                     // syntax error shown by editor itself
    }
  }

  /** Form-view (`<json-schema-form>`) data changes — also advisory-validated. */
  onFormChange(formData: object) {
    this.data.set(formData);
    this.parseValid.set(true);                   // widget data is always a valid object
    this.warnings.set(validateAgainstSchema(this.cleanSchema ?? undefined, formData));
  }

  onSchemaViewChanged() {
    if (this.schemaView() === 'schemaForm') {
      this.formInitialData = this.data() ?? undefined; // JSON → form
    } else {
      this.setJsonText(this.data() ? JSON.stringify(this.data()) : ''); // form → JSON
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
