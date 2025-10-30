import { Component, Input, Output, EventEmitter, forwardRef, ViewChild, ElementRef, TemplateRef, ContentChildren, QueryList, AfterContentInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface MatSelectChange {
  source: CustomSelectComponent;
  value: any;
}

@Component({
  selector: 'app-option',
  template: '<div class="custom-option-content" [class.selected]="selected" [class.disabled]="disabled" (click)="select()"><ng-content></ng-content></div>',
  styleUrls: ['./custom-select.component.scss'],
  standalone: true
})
export class CustomOptionComponent {
  @Input() value: any;
  @Input() disabled = false;
  @Input() selected = false;

  @Output() onSelectionChange = new EventEmitter<CustomOptionComponent>();

  select() {
    if (this.disabled) return;
    this.onSelectionChange.emit(this);
  }
}

@Component({
  selector: 'app-select',
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.scss'],
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ]
})
export class CustomSelectComponent implements ControlValueAccessor, AfterContentInit {
  @Input() disabled = false;
  @Input() placeholder = '';
  @Input() multiple = false;
  @Input() required = false;
  @Input() name: string;
  @Input() id: string;
  @Input() invalid = false;
  @Input() errorMessage = '';

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
  @ViewChild('selectTrigger', { static: true }) selectTrigger: ElementRef;

  isOpen = false;
  selectedValues: any[] = [];
  displayValue = '';

  private _onChange = (value: any) => {};
  private _onTouched = () => {};

  ngAfterContentInit() {
    if (this.options) {
      this.options.forEach(option => {
        option.onSelectionChange.subscribe(selectedOption => {
          this.selectOption(selectedOption);
        });
      });
    }
  }

  toggle() {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    this._onTouched();
  }

  selectOption(option: CustomOptionComponent) {
    if (option.disabled) return;

    if (this.multiple) {
      const index = this.selectedValues.indexOf(option.value);
      if (index === -1) {
        this.selectedValues.push(option.value);
      } else {
        this.selectedValues.splice(index, 1);
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
  }

  private updateDisplayValue() {
    if (this.selectedValues.length === 0) {
      this.displayValue = '';
    } else if (this.multiple) {
      this.displayValue = `${this.selectedValues.length} selected`;
    } else {
      if (this.options) {
        const selectedOption = this.options.find(opt => opt.value === this.selectedValues[0]);
        this.displayValue = selectedOption ? selectedOption.value : this.selectedValues[0];
      } else {
        this.displayValue = this.selectedValues[0];
      }
    }
  }

  private updateOptions() {
    if (this.options) {
      this.options.forEach(option => {
        option.selected = this.selectedValues.includes(option.value);
      });
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (this.multiple && Array.isArray(value)) {
      this.selectedValues = value;
    } else if (!this.multiple && value !== undefined) {
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
}