import { ChangeDetectionStrategy, AfterViewInit,
  Component,
  effect,
  ElementRef,
  EventEmitter,
  forwardRef,
  inject,
  Input,
  OnDestroy,
  Output,
  ViewChild,
 } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { StratosBrandingService } from '../../../../../theme/stratos-branding.service';
import { loadMonacoEditor } from '../../../monaco-loader';

export interface MonacoEditorModel {
  language?: string;
  uri?: string;
}

export interface MonacoEditorOptions {
  automaticLayout?: boolean;
  contextmenu?: boolean;
  tabSize?: number;
  theme?: string;
  readOnly?: boolean;
  minimap?: { enabled?: boolean };
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  scrollBeyondLastLine?: boolean;
  wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  [key: string]: any;
}

@Component({
  selector: 'app-monaco-editor',
  templateUrl: './monaco-editor.component.html',
  host: { class: 'block w-full h-full' },
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MonacoEditorComponent),
      multi: true
    }
  ]
})
export class MonacoEditorComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef<HTMLDivElement>;

  @Input() options: MonacoEditorOptions = {};
  @Input() model?: MonacoEditorModel;
  @Output() editorInit = new EventEmitter<MonacoEditorComponent>();
  // Fires for every content change, including ones no ngModel is bound to —
  // consumers without a CVA binding have no other change signal.
  @Output() valueChange = new EventEmitter<string>();

  private branding = inject(StratosBrandingService);
  private editor: import('monaco-editor').editor.IStandaloneCodeEditor | undefined;
  private monaco: Awaited<ReturnType<typeof loadMonacoEditor>> | undefined;

  constructor() {
    // Monaco's theme is process-global (monaco.editor.setTheme), so one
    // editor following the app theme re-skins every editor on the page.
    // Callers that pin options.theme opt out of the sync.
    effect(() => {
      const dark = this.branding.isDarkMode();
      if (!this.editor || this.options.theme || !this.monaco) {
        return;
      }
      this.monaco.editor.setTheme(dark ? 'vs-dark' : 'vs');
    });
  }
  private value = '';
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private disabled = false;
  private resizeObserver?: ResizeObserver;
  private destroyed = false;

  async ngAfterViewInit(): Promise<void> {
    try {
      // Monaco is loaded on demand (not at bootstrap); idempotent across editors
      this.monaco = await loadMonacoEditor();
    } catch (error) {
      console.error('Failed to load Monaco Editor:', error);
      return;
    }
    if (this.destroyed) {
      return;
    }
    this.initMonaco();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.destroyEditor();
  }

  private initMonaco(): void {
    const monaco = this.monaco;
    if (!monaco) {
      console.error('Monaco editor is not loaded. loadMonacoEditor() resolved without an instance.');
      return;
    }

    // Merge default options with provided options
    const editorOptions = {
      value: this.value,
      language: this.model?.language || 'plaintext',
      theme: this.options.theme || (this.branding.isDarkMode() ? 'vs-dark' : 'vs'),
      automaticLayout: false,
      readOnly: this.disabled,
      ...this.options,
    };

    // Create the editor
    const editor = monaco.editor.create(this.editorContainer.nativeElement, editorOptions);
    this.editor = editor;

    // Set model if uri is provided
    if (this.model?.uri) {
      const uri = monaco.Uri.parse(this.model.uri);
      let model = monaco.editor.getModel(uri);

      if (!model) {
        model = monaco.editor.createModel(
          this.value,
          this.model.language || 'plaintext',
          uri
        );
      }

      editor.setModel(model);
    }

    // Listen for content changes
    editor.onDidChangeModelContent(() => {
      const newValue = editor.getValue();
      if (newValue !== this.value) {
        this.value = newValue;
        this.onChange(newValue);
        this.valueChange.emit(newValue);
      }
    });

    // Listen for blur events
    editor.onDidBlurEditorText(() => {
      this.onTouched();
    });

    // Setup resize observer if automaticLayout is false
    if (this.options.automaticLayout === false) {
      this.setupResizeObserver();
    }

    // Emit initialization event
    this.editorInit.emit(this);
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.editor) {
          this.editor.layout();
        }
      });

      this.resizeObserver.observe(this.editorContainer.nativeElement);
    }
  }

  private destroyEditor(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }

    if (this.editor) {
      this.editor.dispose();
      this.editor = undefined;
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
    if (this.editor) {
      const currentValue = this.editor.getValue();
      if (currentValue !== this.value) {
        this.editor.setValue(this.value);
      }
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.editor) {
      this.editor.updateOptions({ readOnly: isDisabled });
    }
  }

  // Public API methods to match ngx-monaco-editor
  public updateOptions(options: MonacoEditorOptions): void {
    if (this.editor) {
      this.editor.updateOptions(options);
    }
  }

  public layout(): void {
    if (this.editor) {
      this.editor.layout();
    }
  }

  public focus(): void {
    if (this.editor) {
      this.editor.focus();
    }
  }

  public getValue(): string {
    return this.editor ? this.editor.getValue() : this.value;
  }

  public setValue(value: string): void {
    this.writeValue(value);
  }

  public setLanguage(language: string): void {
    const model = this.editor?.getModel();
    if (this.monaco && model) {
      this.monaco.editor.setModelLanguage(model, language);
    }
  }
}
