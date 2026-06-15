import { ChangeDetectionStrategy, AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  Output,
  ViewChild,
 } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

declare const monaco: typeof import('monaco-editor');

export interface MonacoEditorModel {
  language?: string;
  uri?: string;
  value?: string;
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
  @Output() editorInit = new EventEmitter<any>();

  private editor: any;
  private value = '';
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private disabled = false;
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.initMonaco();
  }

  ngOnDestroy(): void {
    this.destroyEditor();
  }

  private initMonaco(): void {
    if (typeof monaco === 'undefined') {
      console.error('Monaco editor is not loaded. Ensure monaco-editor is loaded globally.');
      return;
    }

    // Merge default options with provided options
    const editorOptions = {
      value: this.value,
      language: this.model?.language || 'plaintext',
      theme: this.options.theme || 'vs',
      automaticLayout: false,
      readOnly: this.disabled,
      ...this.options,
    };

    // Create the editor
    this.editor = monaco.editor.create(this.editorContainer.nativeElement, editorOptions);

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

      this.editor.setModel(model);
    }

    // Listen for content changes
    this.editor.onDidChangeModelContent(() => {
      const newValue = this.editor.getValue();
      if (newValue !== this.value) {
        this.value = newValue;
        this.onChange(newValue);
      }
    });

    // Listen for blur events
    this.editor.onDidBlurEditorText(() => {
      this.onTouched();
    });

    // Setup resize observer if automaticLayout is false
    if (this.options.automaticLayout === false) {
      this.setupResizeObserver();
    }

    // Emit initialization event
    this.editorInit.emit(this.editor);
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

  public getEditor(): any {
    return this.editor;
  }
}
