# Monaco Editor Component

A standalone Angular component that wraps Monaco Editor behind an ngx-monaco-editor-style API. The wrapper component is the whole public surface — the raw Monaco instance is never exposed.

## Features

- ✅ Standalone component (no module required)
- ✅ Full ngModel two-way binding support via ControlValueAccessor
- ✅ TypeScript type safety (typed by the monaco-editor package itself)
- ✅ Automatic layout handling with ResizeObserver
- ✅ Automatic app-theme synchronization (opt out by pinning `options.theme`)
- ✅ YAML language support (via monaco-yaml)
- ✅ ngx-monaco-editor-compatible options and methods (the wrapper, not the raw Monaco instance, is the public surface)

## Usage

### Basic Example

```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MonacoEditorComponent, MonacoEditorOptions, MonacoEditorModel } from '@stratos/core';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [FormsModule, MonacoEditorComponent],
  template: `
    <app-monaco-editor
      #editor
      [options]="editorOptions"
      [model]="model"
      [(ngModel)]="code"
      (editorInit)="onEditorInit($event)">
    </app-monaco-editor>
  `
})
export class ExampleComponent {
  code = '{ "hello": "world" }';

  editorOptions: MonacoEditorOptions = {
    theme: 'vs-dark',
    language: 'json',
    automaticLayout: true,
    minimap: { enabled: true }
  };

  model: MonacoEditorModel = {
    language: 'json'
  };

  onEditorInit(editor: MonacoEditorComponent) {
    console.log('Editor initialized', editor);
  }
}
```

### YAML with Schema

```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { configureYaml } from '../../../monaco-loader';
import { MonacoEditorComponent, MonacoEditorOptions, MonacoEditorModel } from '@stratos/core';

@Component({
  selector: 'app-yaml-editor',
  standalone: true,
  imports: [FormsModule, MonacoEditorComponent],
  template: `
    <app-monaco-editor
      #editor
      [options]="editorOptions"
      [model]="model"
      [(ngModel)]="yamlContent"
      (editorInit)="onEditorInit($event)">
    </app-monaco-editor>
  `
})
export class YamlEditorComponent {
  yamlContent = '';
  editor?: MonacoEditorComponent;

  editorOptions: MonacoEditorOptions = {
    automaticLayout: false,
    contextmenu: false,
    tabSize: 2,
    theme: 'vs'
  };

  model: MonacoEditorModel = {
    language: 'yaml',
    uri: 'https://myapp.com/schema.json'
  };

  onEditorInit(editor: MonacoEditorComponent) {
    this.editor = editor;

    // YAML language support (monaco-yaml) is registered by the ESM loader
    // before any editor exists. Register a schema through the loader's
    // configureYaml() — the model's uri must appear in fileMatch.
    configureYaml({
      enableSchemaRequest: true,
      hover: true,
      completion: true,
      validate: true,
      format: {},
      schemas: [{
        uri: this.model.uri,
        fileMatch: [this.model.uri],
        schema: this.getSchema()
      }]
    }).catch((err) => console.error('Schema registration failed', err));
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        name: { type: 'string' },
        version: { type: 'string' }
      }
    };
  }
}
```

## API

### Inputs

#### `options: MonacoEditorOptions`
Monaco editor configuration options. See [Monaco Editor Options](https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.IStandaloneEditorConstructionOptions.html).

Common options:
```typescript
{
  automaticLayout: boolean,    // Auto-resize on container changes
  contextmenu: boolean,         // Enable right-click menu
  tabSize: number,              // Tab size in spaces
  theme: 'vs' | 'vs-dark',     // Editor theme
  readOnly: boolean,            // Read-only mode
  minimap: { enabled: boolean }, // Show minimap
  lineNumbers: 'on' | 'off',   // Show line numbers
  scrollBeyondLastLine: boolean,
  wordWrap: 'off' | 'on',
  fontSize: number,
  language: string              // Language mode
}
```

#### `model: MonacoEditorModel`
Editor model configuration:
```typescript
{
  language?: string,  // Language ID (e.g., 'yaml', 'javascript', 'json')
  uri?: string        // Unique URI for the model (used for schemas)
}
```

The content itself comes through `ngModel`/`formControl` or `setValue()`.

### Two-way Binding

#### `[(ngModel)]`
Code content with two-way binding support via FormsModule.

### Outputs

#### `(editorInit): EventEmitter<MonacoEditorComponent>`
Emitted when the editor is initialized. Receives the wrapper component itself — the raw Monaco instance is never exposed.

```typescript
onEditorInit(editor: MonacoEditorComponent) {
  editor.updateOptions({ lineNumbers: 'off' });
  editor.focus();
}
```

#### `(valueChange): EventEmitter<string>`
Emitted with the new text on every content change. This is the change signal for consumers that do not bind `ngModel`/`formControl`.

### Public Methods

#### `updateOptions(options: MonacoEditorOptions): void`
Update editor options dynamically.

```typescript
this.editor.updateOptions({
  minimap: { enabled: false },
  lineNumbers: 'off'
});
```

#### `layout(): void`
Trigger editor layout recalculation. Useful when container size changes and `automaticLayout: false`.

```typescript
this.editor.layout();
```

#### `focus(): void`
Focus the editor.

```typescript
this.editor.focus();
```

#### `getValue(): string`
Get the current editor content.

```typescript
const content = this.editor.getValue();
```

#### `setValue(value: string): void`
Set the editor content programmatically.

```typescript
this.editor.setValue('new content');
```

#### `setLanguage(language: string): void`
Switch the language mode of the current model. A no-op until the editor exists.

```typescript
this.editor.setLanguage('json');
```

## Theme Synchronization

The wrapper follows the app theme automatically: when Stratos switches between
light and dark mode, every editor that does not pin `options.theme` is re-themed
(`vs` / `vs-dark`). Setting `options.theme` opts that editor out of the sync and
keeps the pinned theme.

Do not set the Monaco theme yourself. The theme is process-global
(`monaco.editor.setTheme`), so one editor changing it re-skins every editor on
the page — the wrapper is the single place that decision is made.

## Resizing

### Automatic Layout
Set `automaticLayout: true` for automatic resizing:

```typescript
editorOptions = {
  automaticLayout: true
};
```

### Manual Layout
For `automaticLayout: false`, the component uses ResizeObserver automatically. You can also call `layout()` manually:

```typescript
// After container resize
this.editor.layout();
```

### Manual Sizing
You can manually size the editor container:

```typescript
const container = this.editorContainer.nativeElement;
this.renderer.setStyle(container, 'width', '800px');
this.renderer.setStyle(container, 'height', '600px');
this.editor.layout();
```

## Language Support

### Shipped Languages
The lazy chunk is a tree-shaken subset (`edcore.main` plus explicit
contributions in `monaco-loader.ts`) carrying only the languages Stratos
edits:
- JSON (full language service: validation, completion, schemas)
- YAML (tokenizer from monaco-editor; everything else from monaco-yaml)
- Plaintext (built in)

Any other `language` id falls back to plaintext rendering. To ship another
language, add its contribution import to the loader (and a worker wrapper
in `monaco-workers/` if it has a language service).

### YAML Support
YAML support is provided via `monaco-yaml`, registered once by the ESM
loader (`monaco-loader.ts`) before any editor is created — nothing to load
per editor. Schema-driven validation/completion is configured through the
loader's `configureYaml()` helper (see the schema example above).

Language workers ship as hashed lazy chunks for the languages Stratos
edits (json, yaml); other languages fall back to the basic editor worker —
add a wrapper in `monaco-workers/` if a new language surface appears.

### Custom Languages
Registering a custom language needs the raw Monaco API
(`monaco.languages.register`, `setMonarchTokensProvider`), which sits outside
the wrapper's supported surface — components should not reach for the global.
If a custom language is needed, add a loader-level helper in
`core/src/monaco-loader.ts` following the `configureYaml()` /
`configureJsonDiagnostics()` pattern: the helper awaits `loadMonacoEditor()`
and performs the registration in one place.

## Forms Integration

The component implements `ControlValueAccessor` for full Angular Forms support:

### Reactive Forms
```typescript
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  imports: [ReactiveFormsModule, MonacoEditorComponent],
  template: `
    <app-monaco-editor [formControl]="codeControl">
    </app-monaco-editor>
  `
})
export class Example {
  codeControl = new FormControl('initial code');
}
```

### Template-driven Forms
```typescript
@Component({
  imports: [FormsModule, MonacoEditorComponent],
  template: `
    <app-monaco-editor [(ngModel)]="code">
    </app-monaco-editor>
  `
})
export class Example {
  code = 'initial code';
}
```

## Styling

The component provides minimal styling. Customize via CSS:

```scss
app-monaco-editor {
  display: block;
  width: 100%;
  height: 500px;
  border: 1px solid #ccc;
}

// Or use CSS classes
.my-editor {
  height: 400px;

  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
  }
}
```

## Accessibility

Monaco Editor includes built-in accessibility features:
- Screen reader support
- Keyboard navigation
- ARIA labels
- High contrast themes

Enable accessibility mode:
```typescript
editorOptions = {
  accessibilitySupport: 'on'
};
```

## Performance

### Large Files
For large files, consider:

```typescript
editorOptions = {
  largeFileOptimizations: true,
  maxTokenizationLineLength: 20000
};
```

### Diff Editor
The wrapper only creates the standard code editor. Diff viewing needs
`monaco.editor.createDiffEditor`, which sits outside the wrapper's supported
surface — the raw global is not part of the API, so don't reach for it from a
component. If a diff view is needed, add a loader-level helper in
`core/src/monaco-loader.ts` (the `configureYaml()` /
`configureJsonDiagnostics()` pattern) that awaits `loadMonacoEditor()` and
creates the diff editor there.

## Resources

- [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor/)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html)
- [Monaco Languages](https://github.com/microsoft/monaco-languages)
- [Monaco YAML](https://github.com/remcohaszing/monaco-yaml)
