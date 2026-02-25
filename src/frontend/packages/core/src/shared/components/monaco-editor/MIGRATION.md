# Monaco Editor Component Migration Guide

This guide explains how to migrate from `ngx-monaco-editor` to the custom `MonacoEditorComponent`.

## Overview

The custom `MonacoEditorComponent` is a drop-in replacement for `ngx-monaco-editor` with the following benefits:

- Direct integration with `monaco-editor` package (no wrapper)
- Full Angular 20+ compatibility
- Standalone component architecture
- Identical API surface to `ngx-monaco-editor`
- Better TypeScript type support

## Installation

Dependencies have been added to package.json:
- `monaco-editor`: ^0.52.2
- `@types/monaco-editor`: ^0.52.0 (devDependency)

Run: `bun install`

## Migration Steps

### 1. Update Imports

**Before:**
```typescript
import { MonacoEditorModule, NGX_MONACO_EDITOR_CONFIG, NgxMonacoEditorConfig } from 'ngx-monaco-editor';

const monacoConfig: NgxMonacoEditorConfig = {
  baseUrl: '/core/assets',
  defaultOptions: { scrollBeyondLastLine: false }
};

@Component({
  imports: [MonacoEditorModule],
  providers: [
    { provide: NGX_MONACO_EDITOR_CONFIG, useValue: monacoConfig }
  ]
})
```

**After:**
```typescript
import { MonacoEditorComponent, MonacoEditorModel, MonacoEditorOptions } from '@stratos/core';

@Component({
  imports: [MonacoEditorComponent]
  // No provider needed - Monaco is loaded globally
})
```

### 2. Update Template

**Before:**
```html
<ngx-monaco-editor
  #monacoEditor
  class="editor-monaco-edit"
  [options]="editorOptions"
  [model]="model"
  [(ngModel)]="code"
  (onInit)="onMonacoInit($event)">
</ngx-monaco-editor>
```

**After:**
```html
<app-monaco-editor
  #monacoEditor
  class="editor-monaco-edit"
  [options]="editorOptions"
  [model]="model"
  [(ngModel)]="code"
  (onInit)="onMonacoInit($event)">
</app-monaco-editor>
```

### 3. Update Component Code

**Before:**
```typescript
public editorOptions = {
  automaticLayout: false,
  contextmenu: false,
  tabSize: 2,
};

public model: any;

onMonacoInit(editor: any) {
  this.editor = editor;
  const req = (window as any).require;
  req(['vs/language/yaml/monaco.contribution'], () => {
    this.updateModel();
  });
}

private updateModel() {
  this.model = {
    language: 'yaml',
    uri: this.getSchemaUri()
  };
}
```

**After (same code, but with better TypeScript types):**
```typescript
import { MonacoEditorOptions, MonacoEditorModel } from '@stratos/core';

public editorOptions: MonacoEditorOptions = {
  automaticLayout: false,
  contextmenu: false,
  tabSize: 2,
};

public model?: MonacoEditorModel;

onMonacoInit(editor: any) {
  this.editor = editor;
  const req = (window as any).require;
  req(['vs/language/yaml/monaco.contribution'], () => {
    this.updateModel();
  });
}

private updateModel() {
  this.model = {
    language: 'yaml',
    uri: this.getSchemaUri()
  };
}
```

## Example: Complete Migration

See `/Users/wayneeseguin/w/cloudfoundry/stratos/src/frontend/packages/kubernetes/src/kubernetes/workloads/chart-values-editor/chart-values-editor.component.ts` for a complete example.

**Changes needed:**

1. Remove `MonacoEditorModule` from imports
2. Add `MonacoEditorComponent` to imports
3. Remove `NGX_MONACO_EDITOR_CONFIG` provider
4. Change template from `<ngx-monaco-editor>` to `<app-monaco-editor>`
5. Optionally add TypeScript types for better type safety

## API Compatibility

The custom component maintains 100% API compatibility with ngx-monaco-editor:

### Inputs
- `[options]` - Editor options (MonacoEditorOptions)
- `[model]` - Editor model with language and uri (MonacoEditorModel)

### Two-way Binding
- `[(ngModel)]` - Code content binding

### Outputs
- `(onInit)` - Fired when editor initializes, receives editor instance

### Public Methods
- `updateOptions(options)` - Update editor options
- `layout()` - Trigger editor layout recalculation
- `focus()` - Focus the editor
- `getValue()` - Get current editor value
- `setValue(value)` - Set editor value
- `getEditor()` - Get raw Monaco editor instance

## Configuration

Monaco Editor is loaded globally via `/Users/wayneeseguin/w/cloudfoundry/stratos/src/frontend/packages/core/src/monaco-loader.ts` in main.ts.

Assets are configured in angular.json:
```json
{
  "glob": "**/*",
  "input": "node_modules/monaco-editor/min/vs",
  "output": "/core/assets/monaco/vs"
},
{
  "glob": "**/*",
  "input": "node_modules/@cfstratos/monaco-yaml/lib",
  "output": "/core/assets/monaco/vs/language/yaml"
}
```

## Troubleshooting

### Monaco is not defined
Ensure Monaco loader is working:
1. Check that `loadMonacoEditor()` is called in main.ts before bootstrap
2. Verify Monaco assets are copied to `/core/assets/monaco/vs`
3. Check browser console for loader.js 404 errors

### YAML support not working
The YAML language support is loaded via AMD require:
```typescript
const req = (window as any).require;
req(['vs/language/yaml/monaco.contribution'], () => {
  // YAML support is now loaded
});
```

### Editor not resizing
If `automaticLayout: false`, call `layout()` manually:
```typescript
this.editor.layout();
```

Or use ResizeObserver (automatically handled by component).

### Theme not updating
Update theme via Monaco API:
```typescript
const monaco = (window as any).monaco;
monaco.editor.setTheme('vs-dark'); // or 'vs' for light
```

## Next Steps

1. Run `bun install` to install dependencies
2. Update imports in components using Monaco Editor
3. Update templates to use `<app-monaco-editor>`
4. Remove ngx-monaco-editor from package.json (optional)
5. Test all Monaco Editor usage

## Benefits

- **Modern**: Direct monaco-editor integration
- **Type-safe**: Full TypeScript support with @types/monaco-editor
- **Standalone**: No module dependencies
- **Compatible**: Drop-in replacement for ngx-monaco-editor
- **Maintained**: Uses official monaco-editor package
- **Performance**: Lighter weight without wrapper overhead
