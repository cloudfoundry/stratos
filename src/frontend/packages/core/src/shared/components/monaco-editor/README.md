# Monaco Editor Component

A standalone Angular component that provides Monaco Editor integration with full ngx-monaco-editor API compatibility.

## Features

- ✅ Standalone component (no module required)
- ✅ Full ngModel two-way binding support via ControlValueAccessor
- ✅ TypeScript type safety with @types/monaco-editor
- ✅ Automatic layout handling with ResizeObserver
- ✅ Theme synchronization support
- ✅ YAML language support (via @cfstratos/monaco-yaml)
- ✅ 100% API compatible with ngx-monaco-editor

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
      (onInit)="onEditorInit($event)">
    </app-monaco-editor>
  `
})
export class ExampleComponent {
  code = 'console.log("Hello World");';

  editorOptions: MonacoEditorOptions = {
    theme: 'vs-dark',
    language: 'javascript',
    automaticLayout: true,
    minimap: { enabled: true }
  };

  model: MonacoEditorModel = {
    language: 'javascript'
  };

  onEditorInit(editor: any) {
    console.log('Editor initialized', editor);
  }
}
```

### YAML with Schema

```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
      (onInit)="onEditorInit($event)">
    </app-monaco-editor>
  `
})
export class YamlEditorComponent {
  yamlContent = '';
  editor: any;

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

  onEditorInit(editor: any) {
    this.editor = editor;

    // Load YAML language support
    const req = (window as any).require;
    req(['vs/language/yaml/monaco.contribution'], () => {
      // Register YAML schema
      const monaco = (window as any).monaco;
      monaco.languages.yaml.yamlDefaults.setDiagnosticsOptions({
        enableSchemaRequest: true,
        hover: true,
        completion: true,
        validate: true,
        format: true,
        schemas: [{
          uri: this.model.uri,
          fileMatch: [this.model.uri],
          schema: this.getSchema()
        }]
      });
    });
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
  uri?: string,       // Unique URI for the model (used for schemas)
  value?: string      // Initial value (alternative to ngModel)
}
```

### Two-way Binding

#### `[(ngModel)]`
Code content with two-way binding support via FormsModule.

### Outputs

#### `(onInit): EventEmitter<any>`
Emitted when the editor is initialized. Receives the Monaco editor instance.

```typescript
onEditorInit(editor: any) {
  // Access Monaco editor instance
  editor.updateOptions({ lineNumbers: 'off' });
  editor.focus();
}
```

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

#### `getEditor(): any`
Get the raw Monaco editor instance for advanced operations.

```typescript
const monaco = this.editor.getEditor();
monaco.getModel().updateOptions({ tabSize: 4 });
```

## Theme Synchronization

To synchronize with Stratos theme changes:

```typescript
import { ThemeService } from '@stratos/store';

constructor(private themeService: ThemeService) {}

onEditorInit(editor: any) {
  this.editor = editor;

  // Subscribe to theme changes
  this.themeService.getTheme().subscribe((theme: any) => {
    const monaco = (window as any).monaco;
    const monacoTheme = (theme.styleName === 'dark-theme') ? 'vs-dark' : 'vs';
    monaco.editor.setTheme(monacoTheme);
  });
}
```

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

### Built-in Languages
Monaco includes built-in support for:
- JavaScript/TypeScript
- HTML/CSS
- JSON
- Markdown
- And many more...

### YAML Support
YAML support is provided via `@cfstratos/monaco-yaml`:

```typescript
onEditorInit(editor: any) {
  const req = (window as any).require;
  req(['vs/language/yaml/monaco.contribution'], () => {
    console.log('YAML support loaded');
  });
}
```

### Custom Languages
Register custom languages using Monaco API:

```typescript
const monaco = (window as any).monaco;
monaco.languages.register({ id: 'myLang' });
monaco.languages.setMonarchTokensProvider('myLang', {
  // Language definition
});
```

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
For diff viewing, use Monaco's diff editor:

```typescript
onEditorInit(editor: any) {
  const monaco = (window as any).monaco;
  const diffEditor = monaco.editor.createDiffEditor(container);
  diffEditor.setModel({
    original: monaco.editor.createModel(originalCode, 'javascript'),
    modified: monaco.editor.createModel(modifiedCode, 'javascript')
  });
}
```

## Migration from ngx-monaco-editor

See [MIGRATION.md](./MIGRATION.md) for complete migration instructions.

## Resources

- [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor/)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html)
- [Monaco Languages](https://github.com/microsoft/monaco-languages)
- [Monaco YAML](https://github.com/remcohaszing/monaco-yaml)
