
import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, forwardRef  } from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface MatCheckboxChange {
  source: CustomCheckboxComponent;
  checked: boolean;
}

@Component({
  selector: 'mat-checkbox, app-checkbox',
  standalone: true,
  imports: [],
  templateUrl: './custom-checkbox.component.html',
  styleUrls: ['./custom-checkbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomCheckboxComponent),
      multi: true
    }
  ]
})
export class CustomCheckboxComponent implements ControlValueAccessor {
  @Input() disabled = false;
  @Input() indeterminate = false;
  @Input() checked = false;
  @Input() value: unknown;
  @Input() name!: string;
  @Input() id!: string;
  @Input() required = false;
  @Input() labelPosition: 'before' | 'after' = 'after';
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() invalid = false;
  @Input() errorMessage = '';

  @Output() change = new EventEmitter<MatCheckboxChange>();
  @Output() indeterminateChange = new EventEmitter<boolean>();

  private _onChange = (_value: boolean) => {
    // ControlValueAccessor callback
  };
  private _onTouched = () => {
    // ControlValueAccessor callback
  };

  toggle() {
    if (this.disabled) return;
    
    this.checked = !this.checked;
    this.indeterminate = false;
    
    this._onChange(this.checked);
    this._onTouched();
    
    this.change.emit({
      source: this,
      checked: this.checked
    });
    
    this.indeterminateChange.emit(this.indeterminate);
  }

  // ControlValueAccessor implementation
  writeValue(value: boolean): void {
    this.checked = value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
