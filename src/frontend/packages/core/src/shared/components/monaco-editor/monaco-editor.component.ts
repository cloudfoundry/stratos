import {
  ChangeDetectionStrategy, AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  inject,
  OnDestroy,
  input,
  output,
  signal,
  viewChild
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

type MonacoApi = Awaited<ReturnType<typeof loadMonacoEditor>>;

// "Tab moves focus", page-wide like Monaco's own toggle, which it replaces:
// Monaco keeps that state where no editor API can read it, so a hint could
// not follow it. Monaco's key is Ctrl+M, or Ctrl+Shift+M on macOS; Ctrl+M is
// Enter in a terminal, so Ctrl+Shift+M is the key everywhere, the SSH
// terminal's too.
const tabMovesFocus = signal(false);
let monacoApi: MonacoApi | undefined;
let nextHintId = 0;

export function toggleTabMovesFocus(): void {
  tabMovesFocus.update(v => !v);
  monacoApi?.editor.getEditors().forEach(e => e.updateOptions({ tabFocusMode: tabMovesFocus() }));
}

function addTabFocusKey(monaco: MonacoApi): void {
  if (monacoApi) {
    return;
  }
  monacoApi = monaco;
  const { KeyMod, KeyCode } = monaco;
  const mac = /Mac|iP(hone|ad|od)/.test(navigator.platform);
  monaco.editor.registerCommand('stratos.toggleTabMovesFocus', toggleTabMovesFocus);
  monaco.editor.addKeybindingRules([
    {
      keybinding: mac ? KeyMod.WinCtrl | KeyMod.Shift | KeyCode.KeyM : KeyMod.CtrlCmd | KeyCode.KeyM,
      command: '-editor.action.toggleTabFocusMode',
    },
    {
      keybinding: (mac ? KeyMod.WinCtrl : KeyMod.CtrlCmd) | KeyMod.Shift | KeyCode.KeyM,
      command: 'stratos.toggleTabMovesFocus',
    },
  ]);
}

@Component({
  selector: 'app-monaco-editor',
  templateUrl: './monaco-editor.component.html',
  host: { class: 'relative block w-full h-full' },
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
  readonly editorContainer = viewChild.required<ElementRef<HTMLDivElement>>('editorContainer');

  readonly options = input<MonacoEditorOptions>({});
  readonly model = input<MonacoEditorModel>();
  readonly editorInit = output<MonacoEditorComponent>();
  // Fires for every content change, including ones no ngModel is bound to —
  // consumers without a CVA binding have no other change signal.
  readonly valueChange = output<string>();

  // Tab indents. The hint names the key that makes Tab leave the editor
  // (WCAG 2.1.2); it is the editor's description and shows while focused.
  readonly hintId = `monaco-tab-hint-${nextHintId++}`;
  readonly focused = signal(false);
  readonly tabHint = computed(() => tabMovesFocus()
    ? 'Tab moves focus. Press Ctrl+Shift+M so Tab indents.'
    : 'Tab indents. Press Ctrl+Shift+M so Tab moves focus.');

  private branding = inject(StratosBrandingService);
  private editor: import('monaco-editor').editor.IStandaloneCodeEditor | undefined;
  private monaco: MonacoApi | undefined;

  constructor() {
    // Monaco's theme is process-global (monaco.editor.setTheme), so one
    // editor following the app theme re-skins every editor on the page.
    // Callers that pin options.theme opt out of the sync.
    effect(() => {
      const dark = this.branding.isDarkMode();
      if (!this.editor || this.options().theme || !this.monaco) {
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
      language: this.model()?.language || 'plaintext',
      theme: this.options().theme || (this.branding.isDarkMode() ? 'vs-dark' : 'vs'),
      automaticLayout: false,
      readOnly: this.disabled,
      tabFocusMode: tabMovesFocus(),
      ...this.options(),
    };

    // Create the editor
    const editor = monaco.editor.create(this.editorContainer().nativeElement, editorOptions);
    this.editor = editor;

    // Set model if uri is provided
    const modelValue = this.model();
    if (modelValue?.uri) {
      const uri = monaco.Uri.parse(modelValue.uri);
      let model = monaco.editor.getModel(uri);

      if (!model) {
        model = monaco.editor.createModel(
          this.value,
          modelValue.language || 'plaintext',
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
      this.focused.set(false);
      this.onTouched();
    });
    editor.onDidFocusEditorText(() => this.focused.set(true));

    addTabFocusKey(monaco);
    this.editorContainer().nativeElement.querySelector('[role="textbox"], textarea')
      ?.setAttribute('aria-describedby', this.hintId);

    // Setup resize observer if automaticLayout is false
    if (this.options().automaticLayout === false) {
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

      this.resizeObserver.observe(this.editorContainer().nativeElement);
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
