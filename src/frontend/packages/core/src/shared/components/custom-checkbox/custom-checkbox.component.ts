
import { ChangeDetectionStrategy, Component, forwardRef, input, model, output } from '@angular/core';
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
  // Models: a parent binds them, and the control writes them too (a click,
  // or the form through the value accessor).
  readonly disabled = model(false);
  readonly indeterminate = model(false);
  readonly checked = model(false);
  readonly value = input<any>();
  readonly name = input<string>();
  readonly id = input<string>();
  readonly required = input(false);
  readonly labelPosition = input<'before' | 'after'>('after');
  readonly color = input<'primary' | 'accent' | 'warn'>('primary');
  readonly invalid = input(false);
  readonly errorMessage = input('');

  // eslint-disable-next-line @angular-eslint/no-output-native -- intentional Material API parity: drop-in for mat-checkbox which emits (change)
  readonly change = output<MatCheckboxChange>();

  private _onChange = (_value: any) => {};
  private _onTouched = () => {};

  toggle() {
    if (this.disabled()) return;

    const checked = !this.checked();
    this.checked.set(checked);
    this.indeterminate.set(false);

    this._onChange(checked);
    this._onTouched();

    this.change.emit({
      source: this,
      checked
    });
  }

  // ControlValueAccessor implementation
  writeValue(value: boolean): void {
    this.checked.set(value);
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
