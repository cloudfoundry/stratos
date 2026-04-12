import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Output, EventEmitter, forwardRef, ViewChild, ElementRef, ContentChildren, QueryList, AfterContentInit, AfterViewInit, HostListener, OnDestroy, booleanAttribute, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';


export interface MatSelectChange {
  source: CustomSelectComponent;
  value: any;
}

@Component({
  selector: 'app-option',
  template: `<div #optionContent
    class="custom-option-content py-2 px-3 cursor-pointer whitespace-nowrap"
    [class.selected]="selected"
    [class.disabled]="disabled"
    [ngClass]="{
      'bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-400': selected,
      'text-content-primary dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700': !selected,
      'opacity-50 cursor-not-allowed hover:bg-transparent': disabled
    }"
    ><ng-content></ng-content></div>`,
  styleUrls: ['./custom-select.component.css'],
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomOptionComponent implements AfterViewInit {
  private cdr = inject(ChangeDetectorRef);

  @Input() value: any;
  @Input() label?: string;
  @Input() disabled = false;
  @Input() selected = false;

  @ViewChild('optionContent', { static: true }) optionContent!: ElementRef;

  private _displayText?: string;

  ngAfterViewInit() {
    if (!this.label && this.optionContent) {
      this._displayText = this.optionContent.nativeElement.textContent?.trim();
      this.cdr.markForCheck();
    }
  }

  get displayText(): string {
    return this.label || this._displayText || this.value;
  }
}

@Component({
  selector: 'app-select',
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.css'],
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ]
})
export class CustomSelectComponent implements ControlValueAccessor, AfterContentInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private elementRef = inject(ElementRef);

  @Input() disabled = false;
  @Input() placeholder = '';
  @Input({ transform: booleanAttribute }) multiple = false;
  @Input() required = false;
  @Input() name!: string;
  @Input() id!: string;
  @Input() invalid = false;
  @Input() errorMessage = '';
  @Input() autoSelectSingleOption = true; // Auto-select when only one option exists

  @Input()
  get value(): any {
    return this.multiple ? this.selectedValues : this.selectedValues[0];
  }
  set value(val: any) {
    this.writeValue(val);
  }

  @Output() selectionChange = new EventEmitter<MatSelectChange>();
  @Output() valueChange = new EventEmitter<any>();

  @ContentChildren(CustomOptionComponent) options: QueryList<CustomOptionComponent>;
  @ViewChild('selectTrigger', { static: true }) selectTrigger!: ElementRef;
  @ViewChild('selectOptions', { static: true }) selectOptions!: ElementRef;

  isOpen = false;
  selectedValues: any[] = [];
  displayValue = '';
  dropdownTop = '0px';
  dropdownLeft = '0px';
  dropdownWidth = '0px';

  // Interaction lock: ignore external writeValue while user is actively selecting in multi-select
  private _interacting = false;

  private _onChange = (_value: any) => {};
  private _onTouched = () => {};
  private _subscriptions: Subscription[] = [];

  ngAfterContentInit() {
    // Sync option visual state when options change (dynamic @for lists)
    const optionsChangeSub = this.options.changes.subscribe(() => {
      this.checkAutoSelect();
      this.updateOptions();
      setTimeout(() => {
        this.updateDisplayValue();
        this.cdr.markForCheck();
      });
    });
    this._subscriptions.push(optionsChangeSub);

    this.checkAutoSelect();
    this.updateDisplayValue();
    this.updateOptions();
  }

  ngOnDestroy() {
    this._subscriptions.forEach(sub => sub.unsubscribe());
  }

  private checkAutoSelect() {
    // Auto-select single option if enabled and no value is currently selected
    if (this.autoSelectSingleOption &&
        !this.multiple &&
        this.selectedValues.length === 0 &&
        this.options &&
        this.options.length === 1) {
      const singleOption = this.options.first;
      if (singleOption && !singleOption.disabled) {
        // Auto-select the single option
        this.selectOption(singleOption);
      }
    }
  }

  toggle() {
    if (this.disabled) return;

    if (!this.isOpen) {
      // Calculate position BEFORE opening dropdown to prevent flash at wrong position
      const rect = this.selectTrigger.nativeElement.getBoundingClientRect();
      this.dropdownTop = `${rect.bottom + 4}px`;  // Add 4px gap for better spacing
      this.dropdownLeft = `${rect.left}px`;
      // Use trigger width as minimum, but allow dropdown to expand for content
      this.dropdownWidth = `${rect.width}px`;
    }

    this.isOpen = !this.isOpen;
    this._interacting = this.isOpen && this.multiple;
    this._onTouched();
    this.cdr.markForCheck();
  }

  /**
   * Event delegation handler for option clicks.
   * Finds the clicked option by matching the DOM element to the
   * ContentChildren QueryList, bypassing subscription timing issues.
   */
  onOptionsClick(event: MouseEvent) {
    const clickTarget = event.target as HTMLElement;
    const target = clickTarget.closest('.custom-option-content');
    if (!target) return;

    // Find the matching option component by DOM element match
    const option = this.options?.find(opt =>
      opt.optionContent?.nativeElement === target
    );

    if (option) {
      this.selectOption(option);
    }
  }

  selectOption(option: CustomOptionComponent) {
    if (option.disabled) return;

    if (this.multiple) {
      const index = this.selectedValues.indexOf(option.value);
      if (index === -1) {
        this.selectedValues = [...this.selectedValues, option.value];
      } else {
        this.selectedValues = this.selectedValues.filter((_, i) => i !== index);
      }
    } else {
      this.selectedValues = [option.value];
      this.isOpen = false;
    }

    this.updateDisplayValue();
    this.updateOptions();

    const value = this.multiple ? this.selectedValues : this.selectedValues[0];
    this._onChange(value);

    this.selectionChange.emit({
      source: this,
      value: value
    });

    this.valueChange.emit(value);
    this.cdr.markForCheck();
  }

  private updateDisplayValue() {
    if (this.selectedValues.length === 0) {
      this.displayValue = '';
    } else if (this.multiple && this.selectedValues.length > 1) {
      this.displayValue = `${this.selectedValues.length} selected`;
    } else {
      // Single selection, or multi with exactly 1 selected — show the item name.
      // When the matching option isn't found yet (async @for not rendered), show
      // empty so the placeholder displays instead of flashing a raw value/GUID.
      if (this.options) {
        const selectedOption = this.options.find(opt => opt.value === this.selectedValues[0]);
        this.displayValue = selectedOption ? selectedOption.displayText : '';
      } else {
        this.displayValue = '';
      }
    }
    this.cdr.markForCheck();
  }

  private updateOptions() {
    if (this.options) {
      this.options.forEach(option => {
        const isSelected = this.selectedValues.includes(option.value);
        if (option.selected !== isSelected) {
          option.selected = isSelected;
          option['cdr'].markForCheck();
        }
      });
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    // Interaction lock: ignore external writes while user is actively selecting.
    // Always allow clears (reset button) even during interaction.
    if (this._interacting && value !== null && value !== undefined &&
        (!Array.isArray(value) || value.length > 0)) {
      return;
    }

    if (this.multiple && Array.isArray(value)) {
      this.selectedValues = value || [];
    } else if (!this.multiple && value !== undefined && value !== null) {
      this.selectedValues = [value];
    } else {
      this.selectedValues = [];
    }
    this.updateDisplayValue();
    this.updateOptions();
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isOpen) return;

    const target = event.target as HTMLElement;

    // Check if click is inside this component (trigger, dropdown, or option).
    // The dropdown is rendered inside the host element, so a single
    // contains() check covers all internal clicks — including option
    // clicks where stopPropagation doesn't prevent the HostListener.
    if (this.elementRef.nativeElement.contains(target)) {
      return;
    }

    this.isOpen = false;
    this._interacting = false;
    this.cdr.markForCheck();
  }
}