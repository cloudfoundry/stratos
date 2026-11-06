
import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, forwardRef  } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

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
  @Input() value: any;
  @Input() name!: string;
  @Input() id!: string;
  @Input() required = false;
  @Input() labelPosition: 'before' | 'after' = 'after';
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() invalid = false;
  @Input() errorMessage = '';

  // eslint-disable-next-line @angular-eslint/no-output-native -- intentional Material API parity: drop-in for mat-checkbox which emits (change)
  @Output() change = new EventEmitter<MatCheckboxChange>();
  @Output() indeterminateChange = new EventEmitter<boolean>();

  private _onChange = (_value: any) => {};
  private _onTouched = () => {};

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
