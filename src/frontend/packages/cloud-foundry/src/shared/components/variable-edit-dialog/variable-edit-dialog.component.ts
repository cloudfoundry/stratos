import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MonacoEditorComponent,
  MonacoEditorModel,
  MonacoEditorOptions,
  TailwindDialogRef,
} from '@stratosui/core';

import {
  jsonModeWarning,
  looksLikeJson,
  validateVariableName,
} from './variable-edit-dialog.validation';

/** Input to the dialog. `existingNames` is the set the new name must NOT
 *  collide with — the caller pre-excludes the row's own name when editing. */
export interface VariableEditDialogData {
  mode: 'add' | 'edit';
  name?: string;
  value?: string;
  existingNames?: string[];
}

/** Result returned via dialogRef.close(). undefined = cancelled. Rename vs
 *  update routing is the caller's job (compare against the original name). */
export interface VariableEditDialogResult {
  name: string;
  value: string;
}

/**
 * VariableEditDialogComponent — popup editor for a single app environment
 * variable. Serves Add, Edit, and Rename (editing the Name = rename).
 *
 * Layout: full-width Name on top, multiline Monaco value editor below
 * (vertical stack — Name never truncated, Value gets full width). The value
 * is ALWAYS a string: opened verbatim, saved verbatim. "JSON mode" only sets
 * Monaco's language (highlight/validate/format) — it never reformats the
 * stored text. Auto-detected on open; a JSON/Plain toggle overrides.
 *
 * Validation (see variable-edit-dialog.validation): CF's real name rules are
 * hard errors that block Save; the stricter shell-safe pattern and invalid
 * JSON are advisory warnings that still allow Save.
 */
@Component({
  selector: 'app-variable-edit-dialog',
  templateUrl: './variable-edit-dialog.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MonacoEditorComponent],
})
export class VariableEditDialogComponent {
  private dialogRef = inject<TailwindDialogRef<VariableEditDialogComponent, VariableEditDialogResult>>(TailwindDialogRef);
  private data = inject<VariableEditDialogData>(MAT_DIALOG_DATA);

  /** Names the new key must not collide with (caller excludes self). */
  private readonly existingNames: string[];

  readonly name: WritableSignal<string>;
  readonly value: WritableSignal<string>;
  readonly jsonMode: WritableSignal<boolean>;

  readonly title: string;

  /** Monaco editor options — auto-layout so it fills its sized container;
   *  no minimap/line numbers for a compact value editor. */
  readonly editorOptions: MonacoEditorOptions = {
    automaticLayout: true,
    contextmenu: false,
    minimap: { enabled: false },
    lineNumbers: 'off',
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    tabSize: 2,
    // Larger than Monaco's compact default so values stay easy to read.
    fontSize: 16,
  };

  /** Captured Monaco editor instance (undefined until onInit fires; never
   *  fires in unit tests, where Monaco isn't loaded). */
  private editor: any;

  private readonly nameValidation = computed(() => validateVariableName(this.name(), this.existingNames));
  readonly nameError: Signal<string | null> = computed(() => this.nameValidation().hardError);
  readonly nameWarning: Signal<string | null> = computed(() => this.nameValidation().warning);

  /** JSON warning only applies while editing in JSON mode. */
  readonly jsonWarning: Signal<string | null> = computed(() =>
    this.jsonMode() ? jsonModeWarning(this.value()) : null,
  );

  /** Save is gated solely by hard name errors — warnings never block. */
  readonly canSave: Signal<boolean> = computed(() => !this.nameValidation().hardError);

  /** Monaco model — initial language reflects the auto-detected mode. Live
   *  toggles are applied via setModelLanguage in the effect below. */
  readonly model: Signal<MonacoEditorModel> = computed(() => ({
    language: this.jsonMode() ? 'json' : 'plaintext',
  }));

  constructor() {
    this.existingNames = this.data.existingNames ?? [];
    this.name = signal(this.data.name ?? '');
    this.value = signal(this.data.value ?? '');
    this.jsonMode = signal(looksLikeJson(this.data.value ?? ''));
    this.title = this.data.mode === 'add' ? 'Add Variable' : 'Edit Variable';

    // Apply live language switches to the running editor when the user
    // toggles JSON/Plain. Guarded so it's a no-op before the editor exists.
    effect(() => {
      const language = this.jsonMode() ? 'json' : 'plaintext';
      const monaco = (window as any).monaco;
      if (this.editor && monaco) {
        monaco.editor.setModelLanguage(this.editor.getModel(), language);
      }
    });
  }

  onEditorInit(editor: any): void {
    this.editor = editor;
  }

  toggleJsonMode(): void {
    this.jsonMode.update((v) => !v);
  }

  save(): void {
    if (!this.canSave()) {
      return;
    }
    this.dialogRef.close({ name: this.name().trim(), value: this.value() });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
