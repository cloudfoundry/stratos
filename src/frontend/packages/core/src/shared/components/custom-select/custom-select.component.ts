import { ChangeDetectionStrategy, Component, forwardRef, ElementRef, AfterContentInit, AfterViewInit, HostListener, booleanAttribute, computed, contentChildren, effect, inject, input, model, output, signal, untracked, viewChild } from '@angular/core';
import { NgClass } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AppBusyComponent } from '../busy-indicator/busy-indicator.component';


let nextSelectUid = 0;

export interface MatSelectChange {
  source: CustomSelectComponent;
  value: any;
}

@Component({
  selector: 'app-option',
  template: `<div #optionContent
    class="custom-option-content py-2 px-3 cursor-pointer whitespace-nowrap"
    [class.selected]="selected()"
    [class.disabled]="disabled()"
    [ngClass]="{
      'bg-info-50 dark:bg-info-900/40 text-primary': selected(),
      'text-content-text hover:bg-content-secondary': !selected(),
      'opacity-50 cursor-not-allowed hover:bg-transparent': disabled()
    }"
    ><ng-content></ng-content></div>`,
  styleUrls: ['./custom-select.component.css'],
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The host is the listbox's child, so it carries the option semantics
  host: {
    role: 'option',
    '[attr.aria-selected]': 'selected()',
    '[attr.aria-disabled]': 'disabled() || null',
  },
})
export class CustomOptionComponent implements AfterViewInit {
  readonly value = input<any>();
  readonly label = input<string>();
  readonly disabled = input(false);
  // A model: the select that owns the option sets it from code.
  readonly selected = model(false);

  readonly optionContent = viewChild<ElementRef>('optionContent');

  // The text projected into the option, read from the DOM once it renders.
  // A signal, so a select that shows it updates when it arrives.
  private readonly _displayText = signal<string | undefined>(undefined);

  ngAfterViewInit() {
    const optionContent = this.optionContent();
    if (!this.label() && optionContent) {
      this._displayText.set(optionContent.nativeElement.textContent?.trim());
    }
  }

  get displayText(): string {
    // Only fall back to `value` when it is itself a string: options may
    // carry object values ([value]="domain"), and returning the object
    // here crashed applyOptionFilter's .toLowerCase() the moment such an
    // option had empty projected text.
    const value = this.value();
    return this.label() || this._displayText() || (typeof value === 'string' ? value : '');
  }
}

@Component({
  selector: 'app-select',
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.css'],
  standalone: true,
  imports: [NgClass, AppBusyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ]
})
export class CustomSelectComponent implements ControlValueAccessor, AfterContentInit {
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
    // Sync option visual state when the options change (dynamic @for lists).
    // ngAfterContentInit handles the list the select starts with.
    effect(() => {
      const options = this.options();
      untracked(() => {
        if (options === this.syncedOptions) {
          return;
        }
        this.syncedOptions = options;
        this.checkAutoSelect();
        this.updateOptions();
      });
    });
  }

  readonly selectionChange = output<MatSelectChange>();
  readonly valueChange = output<any>();

  readonly options = contentChildren(CustomOptionComponent);
  // The option list last synced, so the effect in the constructor acts only
  // on a changed list.
  private syncedOptions?: readonly CustomOptionComponent[];
  readonly selectTrigger = viewChild.required<ElementRef>('selectTrigger');
  readonly selectOptions = viewChild.required<ElementRef>('selectOptions');

  readonly isOpen = signal(false);
  readonly selectedValues = signal<any[]>([]);
  readonly searchTerm = signal('');

  // Follows the selection and the option list, so text that an option only
  // learns after it renders reaches the trigger without a refresh call.
  // When the matching option isn't found yet (async @for not rendered), it
  // is empty so the placeholder displays instead of a raw value/GUID.
  readonly displayValue = computed(() => {
    const selected = this.selectedValues();
    if (selected.length === 0) {
      return '';
    }
    if (this.multiple() && selected.length > 1) {
      return `${selected.length} selected`;
    }
    // Single selection, or multi with exactly 1 selected: show the item name.
    const selectedOption = this.options().find(opt => opt.value() === selected[0]);
    return selectedOption ? selectedOption.displayText : '';
  });
  // Show the type-to-filter input once the list crosses this length —
  // a 5-option select stays clean without it; a 50-org list desperately
  // needs it.
  private readonly searchThreshold = 5;

  /**
   * Longest projected option text by character count. Rendered as an
   * invisible sizer in the trigger so the trigger width stays stable
   * once the option list is populated — picking a shorter value won't
   * shrink the control. Char-count is a proxy for pixel-width: fine for
   * proportional fonts when options are similar in style.
   */
  get longestOptionText(): string {
    let longest = '';
    this.options().forEach(opt => {
      const t = opt.displayText ?? '';
      if (t.length > longest.length) longest = t;
    });
    return longest;
  }
  readonly dropdownTop = signal('0px');
  readonly dropdownLeft = signal('0px');
  readonly dropdownWidth = signal('0px');

  // Interaction lock: ignore external writeValue while user is actively selecting in multi-select
  private _interacting = false;

  private _onChange = (_value: any) => {};
  private _onTouched = () => {};

  ngAfterContentInit() {
    this.syncedOptions = this.options();
    this.checkAutoSelect();
    this.updateOptions();
  }

  private checkAutoSelect() {
    // Auto-select single option if enabled and no value is currently selected
    const options = this.options();
    if (this.autoSelectSingleOption() &&
        !this.multiple() &&
        this.selectedValues().length === 0 &&
        options.length === 1) {
      const singleOption = options[0];
      if (singleOption && !singleOption.disabled()) {
        // Auto-select the single option
        this.selectOption(singleOption);
      }
    }
  }

  toggle() {
    if (this.disabled()) return;

    if (!this.isOpen()) {
      // Calculate position BEFORE opening dropdown to prevent flash at wrong position
      const rect = this.selectTrigger().nativeElement.getBoundingClientRect();
      this.dropdownTop.set(`${rect.bottom + 4}px`);  // Add 4px gap for better spacing
      this.dropdownLeft.set(`${rect.left}px`);
      // Use trigger width as minimum, but allow dropdown to expand for content
      this.dropdownWidth.set(`${rect.width}px`);
    }

    this.isOpen.update(open => !open);
    this._interacting = this.isOpen() && this.multiple();
    if (!this.isOpen()) {
      // Clear filter on close so the next open shows the full list.
      this.searchTerm.set('');
      this.applyOptionFilter();
    }
    this._onTouched();
  }

  /** True once the option list crosses the threshold worth showing a
   *  search input for. */
  get showSearch(): boolean {
    return this.options().length > this.searchThreshold;
  }

  onSearchInput(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value ?? '');
    this.applyOptionFilter();
  }

  /** Hide each option whose displayText doesn't include the (case-
   *  insensitive) search term. Operates directly on the option's wrapper
   *  element so we don't need to re-render projected content — selection
   *  / focus / visual state stay intact. */
  private applyOptionFilter() {
    const q = this.searchTerm().trim().toLowerCase();
    this.options().forEach(opt => {
      const el = opt.optionContent()?.nativeElement as HTMLElement | undefined;
      if (!el) return;
      const text = (opt.displayText ?? '').toLowerCase();
      el.style.display = !q || text.includes(q) ? '' : 'none';
    });
  }

  /**
   * Event delegation handler for option clicks.
   * Finds the clicked option by matching the DOM element to the
   * projected options, bypassing subscription timing issues.
   */
  onOptionsClick(event: Event) {
    const clickTarget = event.target as HTMLElement;
    const target = clickTarget.closest('.custom-option-content');
    if (!target) return;

    // Find the matching option component by DOM element match
    const option = this.options().find(opt =>
      opt.optionContent()?.nativeElement === target
    );

    if (option) {
      this.selectOption(option);
    }
  }

  selectOption(option: CustomOptionComponent) {
    if (option.disabled()) return;

    const multiple = this.multiple();
    if (multiple) {
      const current = this.selectedValues();
      const index = current.indexOf(option.value());
      if (index === -1) {
        this.selectedValues.set([...current, option.value()]);
      } else {
        this.selectedValues.set(current.filter((_, i) => i !== index));
      }
    } else {
      const valueValue = option.value();
      if (valueValue === null || valueValue === undefined) {
        this.selectedValues.set([]);
      } else {
        this.selectedValues.set([valueValue]);
      }
      this.isOpen.set(false);
    }

    this.updateOptions();

    const selected = this.selectedValues();
    const value = multiple ? selected : (selected[0] ?? null);
    this._onChange(value);

    this.selectionChange.emit({
      source: this,
      value: value
    });

    this.valueChange.emit(value);
  }

  private updateOptions() {
    this.options().forEach(option => {
      const isSelected = this.selectedValues().includes(option.value());
      if (option.selected() !== isSelected) {
        option.selected.set(isSelected);
      }
    });
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    // Interaction lock: ignore external writes while user is actively selecting.
    // Always allow clears (reset button) even during interaction.
    if (this._interacting && value !== null && value !== undefined &&
        (!Array.isArray(value) || value.length > 0)) {
      return;
    }

    const multiple = this.multiple();
    if (multiple && Array.isArray(value)) {
      this.selectedValues.set(value || []);
    } else if (!multiple && value !== undefined && value !== null) {
      this.selectedValues.set([value]);
    } else {
      this.selectedValues.set([]);
    }
    this.updateOptions();
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

  // Escape closes the open list and returns focus to the trigger
  // (aria-haspopup="listbox"). It is handled on the host, where focus is
  // while the list is in use, and stopped there: dialogs and the side panel
  // close on any Escape that reaches the document, and one press should only
  // close the innermost popup. With the list closed, Escape passes through.
  @HostListener('keydown.escape', ['$event'])
  onEscape(event: Event) {
    if (!this.isOpen()) return;
    event.stopPropagation();
    this.toggle();
    this.selectTrigger().nativeElement.focus();
  }

  /** The filter input keeps its keys to itself (Enter and Space must not
   *  reach the option list), except Escape, which closes the list. */
  onSearchKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') event.stopPropagation();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isOpen()) return;

    const target = event.target as HTMLElement;

    // Check if click is inside this component (trigger, dropdown, or option).
    // The dropdown is rendered inside the host element, so a single
    // contains() check covers all internal clicks — including option
    // clicks where stopPropagation doesn't prevent the HostListener.
    if (this.elementRef.nativeElement.contains(target)) {
      return;
    }

    this.isOpen.set(false);
    this._interacting = false;
  }
}