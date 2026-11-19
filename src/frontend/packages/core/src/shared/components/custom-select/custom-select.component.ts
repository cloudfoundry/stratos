import { ChangeDetectionStrategy, Component, forwardRef, ElementRef, afterRenderEffect, booleanAttribute, computed, contentChildren, effect, inject, input, linkedSignal, model, output, signal, untracked, viewChild } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Combobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { AppBusyComponent } from '../busy-indicator/busy-indicator.component';


let nextSelectUid = 0;

export interface MatSelectChange {
  source: CustomSelectComponent;
  value: any;
}

/**
 * One choice in an `app-select`. It holds data only: `app-select` renders
 * the real option (role, id, aria-selected, keys) inside its own listbox,
 * because the listbox directive cannot be reached through `<ng-content>`.
 * This view exists to read the projected text, which becomes the option's
 * label when no `label` is given.
 */
@Component({
  selector: 'app-option',
  template: `<span #optionContent><ng-content></ng-content></span>`,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomOptionComponent {
  readonly value = input<any>();
  readonly label = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly optionContent = viewChild.required<ElementRef<HTMLElement>>('optionContent');

  // The projected text, read once it renders. A signal, so a select that
  // shows it updates when it arrives.
  private readonly projectedText = signal('');

  // Only fall back to `value` when it is itself a string: options may
  // carry object values ([value]="domain"), and the text must always be a
  // string (the filter lower-cases it).
  readonly displayText = computed(() => {
    const value = this.value();
    return this.label() || this.projectedText() || (typeof value === 'string' ? value : '');
  });

  constructor() {
    afterRenderEffect(() => {
      this.projectedText.set(this.optionContent().nativeElement.textContent?.trim() ?? '');
    });
  }
}

/**
 * A select built on `@angular/aria` (WAI-ARIA APG combobox). Focus stays
 * on the combobox; the active option is announced through
 * aria-activedescendant.
 *
 * - Up to five options: a select-only combobox. Down, Enter or Space
 *   open the list; Up, Down, Home, End, Page Up and Page Down move;
 *   Enter or Space select; printable characters jump to a match.
 * - More than five (single select): an editable combobox. Typing filters
 *   the list; Down opens it; Enter selects the active option.
 *
 * Escape closes without a change; Tab closes and moves on.
 */
@Component({
  selector: 'app-select',
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.css'],
  standalone: true,
  imports: [NgClass, NgTemplateOutlet, AppBusyComponent, Combobox, ComboboxPopup, ComboboxWidget, Listbox, Option],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ],
  host: {
    // Lets callers ([appFocus]) focus the host; focus goes on to the trigger.
    tabindex: '-1',
    '(focus)': 'focusTrigger()',
  },
})
export class CustomSelectComponent implements ControlValueAccessor {
  private elementRef = inject(ElementRef);

  // A model: a parent binds it and the form disables the select through it.
  readonly disabled = model(false);
  readonly placeholder = input('');
  // Name of the combobox trigger, which takes no name from the value it
  // shows. Falls back to the placeholder.
  readonly ariaLabel = input('');
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly required = input(false);
  readonly name = input<string>();
  // A model: the form field that wraps a select gives it an id when it has none.
  readonly id = model<string>();
  // Keeps list ids unique for selects given neither an id nor a name
  private readonly uid = `${++nextSelectUid}`;
  get listboxId(): string {
    return `select-listbox-${this.id() || this.name() || this.uid}`;
  }
  readonly invalid = input(false);
  readonly errorMessage = input('');
  readonly autoSelectSingleOption = input(true); // Auto-select when only one option exists
  readonly loading = input(false, { transform: booleanAttribute });

  // The value a parent binds. The selection the control holds is in
  // selectedValues; selectedValue returns it in the shape of this input.
  readonly value = input<any>();
  get selectedValue(): any {
    const selected = this.selectedValues();
    return this.multiple() ? selected : selected[0];
  }

  readonly selectionChange = output<MatSelectChange>();
  readonly valueChange = output<any>();

  readonly options = contentChildren(CustomOptionComponent);
  readonly selectTrigger = viewChild<ElementRef<HTMLElement>>('selectTrigger');
  private readonly listbox = viewChild(Listbox);
  private readonly comboboxRef = viewChild(Combobox);
  // The live combobox as a list of one, so the popup is made again for a
  // new one.
  readonly combobox = computed(() => {
    const combobox = this.comboboxRef();
    return combobox ? [combobox] : [];
  });

  // Value of a multiple select's Clear item: choosing it removes every
  // choice. No caller's option can equal it.
  readonly clearAll = {};

  readonly expanded = signal(false);
  /**
   * VoiceOver in Safari says nothing about the list opening when
   * aria-activedescendant is set in the same update, so the active option
   * is exposed 300 ms after it opens. Exposing it after one render was not
   * enough. NOTE: a measured delay, not an event; re-check it with
   * VoiceOver when Safari or @angular/aria change.
   */
  readonly activeShown = signal(false);
  readonly selectedValues = signal<any[]>([]);

  // More than this many options gives a single select a filter.
  private readonly filterThreshold = 5;
  readonly filterable = computed(() => !this.multiple() && this.options().length > this.filterThreshold);

  // Follows the selection and the option list, so text that an option only
  // learns after it renders reaches the trigger. When the matching option
  // isn't there yet (async @for not rendered), it is empty so the
  // placeholder shows instead of a raw value/GUID.
  readonly displayValue = computed(() => {
    const selected = this.selectedValues();
    if (selected.length === 0) {
      return '';
    }
    if (this.multiple() && selected.length > 1) {
      return `${selected.length} selected`;
    }
    return this.options().find(opt => opt.value() === selected[0])?.displayText() ?? '';
  });

  // The text in the filter field. It shows the chosen option until the
  // user types; a pick, or closing the list, puts that text back.
  readonly query = linkedSignal(() => this.displayValue());
  // True once the user has typed since the list opened.
  readonly typed = signal(false);

  readonly visibleOptions = computed(() => {
    const options = this.options();
    const term = this.typed() ? this.query().trim().toLowerCase() : '';
    return term ? options.filter(opt => opt.displayText().toLowerCase().includes(term)) : options;
  });

  /**
   * Longest option text by character count. Rendered as an invisible
   * sizer in the trigger so the trigger width stays stable once the
   * options arrive — picking a shorter value won't shrink the control.
   */
  readonly longestOptionText = computed(() =>
    this.options().reduce((longest, opt) => {
      const text = opt.displayText();
      return text.length > longest.length ? text : longest;
    }, ''));

  readonly accessibleName = computed(() => this.ariaLabel() || this.placeholder() || null);

  readonly dropdownTop = signal('0px');
  readonly dropdownLeft = signal('0px');
  readonly dropdownWidth = signal('0px');

  private _onChange = (_value: any) => {};
  private _onTouched = () => {};

  constructor() {
    // A bound [value] is written through like a form value. With nothing
    // bound the input is undefined on the first run, which must not clear a
    // value the form wrote before it.
    let first = true;
    effect(() => {
      const value = this.value();
      const unbound = first && value === undefined;
      first = false;
      if (!unbound) {
        untracked(() => this.writeValue(value));
      }
    });
    effect(() => {
      this.options();
      untracked(() => this.checkAutoSelect());
    });
    // A disabled combobox takes no keys, Escape included, so a list left
    // open when the select turns disabled (Create App's Organization while
    // its orgs load) could not be closed.
    effect(() => {
      if (this.disabled() && untracked(() => this.expanded())) {
        untracked(() => this.onExpandedChange(false));
      }
    });
    // The trigger changes element when the list crosses the filter
    // length (options often arrive after the select renders). Carry focus
    // over so it does not fall to <body>.
    let hadFocus = false;
    effect(() => {
      this.filterable();
      const active = document.activeElement;
      hadFocus = !!active && active !== this.elementRef.nativeElement && this.elementRef.nativeElement.contains(active);
    });
    afterRenderEffect(() => {
      this.filterable();
      if (hadFocus && !this.elementRef.nativeElement.contains(document.activeElement)) {
        this.focusTrigger();
      }
      hadFocus = false;
    });
    afterRenderEffect(() => {
      if (this.expanded()) {
        this.listbox()?.scrollActiveItemIntoView({ block: 'nearest' });
      }
    });
  }

  private checkAutoSelect() {
    // Auto-select single option if enabled and no value is currently selected
    const options = this.options();
    if (this.autoSelectSingleOption() &&
        !this.multiple() &&
        this.selectedValues().length === 0 &&
        options.length === 1 &&
        !options[0].disabled()) {
      this.commit([options[0].value()]);
    }
  }

  focusTrigger() {
    this.selectTrigger()?.nativeElement.focus();
  }

  /** The combobox opened or closed the list (keys, a click, focus out). */
  onExpandedChange(open: boolean) {
    if (open) {
      // Position before the list shows, so it does not flash at the wrong place.
      const trigger = this.selectTrigger()?.nativeElement;
      const box = (trigger?.closest('.select-trigger') ?? trigger)?.getBoundingClientRect();
      if (box) {
        this.dropdownTop.set(`${box.bottom + 4}px`);
        this.dropdownLeft.set(`${box.left}px`);
        this.dropdownWidth.set(`${box.width}px`);
      }
      setTimeout(() => this.activeShown.set(this.expanded()), 300);
    } else {
      // Closing ends the filter and puts the chosen option's text back.
      this.typed.set(false);
      this.query.set(this.displayValue());
    }
    this.activeShown.set(false);
    this.expanded.set(open);
    this._onTouched();
  }

  open() {
    if (!this.disabled() && !this.expanded()) {
      this.onExpandedChange(true);
    }
  }

  /** The user typed in the filter field. */
  onQueryChange(text: string) {
    this.query.set(text);
    this.typed.set(true);
  }

  /** The listbox changed its value: a click, Enter or Space on an option. */
  onListboxValueChange(values: any[]) {
    if (this.multiple()) {
      this.commit(values.includes(this.clearAll) ? [] : values);
      return;
    }
    // Enter or a click on the chosen option toggles it off in the listbox;
    // a single select keeps it. A new array makes the listbox take it back.
    if (values.length === 0) {
      this.selectedValues.set([...this.selectedValues()]);
      return;
    }
    // A null/undefined option (e.g. "None") clears the selection.
    const picked = values[0];
    this.commit(picked === null || picked === undefined ? [] : [picked]);
  }

  /** A single select closes once a choice is made, even an unchanged one. */
  onOptionCommit() {
    if (this.multiple()) return;
    this.onExpandedChange(false);
    this.focusTrigger();
  }

  private commit(values: any[]) {
    this.selectedValues.set(values);
    const value = this.multiple() ? values : (values[0] ?? null);
    this._onChange(value);
    this.selectionChange.emit({ source: this, value });
    this.valueChange.emit(value);
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    // Interaction lock: ignore external writes while the user is choosing
    // in an open multi-select. Always allow clears (reset button).
    if (this.multiple() && this.expanded() && value !== null && value !== undefined &&
        (!Array.isArray(value) || value.length > 0)) {
      return;
    }

    const multiple = this.multiple();
    if (multiple && Array.isArray(value)) {
      this.selectedValues.set(value);
    } else if (!multiple && value !== undefined && value !== null) {
      this.selectedValues.set([value]);
    } else {
      this.selectedValues.set([]);
    }
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
