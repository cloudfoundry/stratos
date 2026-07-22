import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, forwardRef  } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';


export interface MatSlideToggleChange {
  source: CustomSlideToggleComponent;
  checked: boolean;
}

@Component({
  selector: 'app-slide-toggle',
  templateUrl: './custom-slide-toggle.component.html',
  styleUrls: ['./custom-slide-toggle.component.scss'],
  standalone: true,
  imports: [
    FormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSlideToggleComponent),
      multi: true
    }
  ]
})
export class CustomSlideToggleComponent implements ControlValueAccessor {
  @Input() disabled = false;
  @Input() checked = false;
  @Input() value: any;
  @Input() name!: string;
  @Input() id!: string;
  @Input() required = false;
  @Input() labelPosition: 'before' | 'after' = 'after';
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() invalid = false;
  @Input() errorMessage = '';

  // eslint-disable-next-line @angular-eslint/no-output-native -- intentional Material API parity: drop-in for mat-slide-toggle which emits (change)
  @Output() change = new EventEmitter<MatSlideToggleChange>();

  private _onChange = (_value: any) => {};
  private _onTouched = () => {};

  toggle() {
    if (this.disabled) return;

    this.checked = !this.checked;

    this._onChange(this.checked);
    this._onTouched();

    this.change.emit({
      source: this,
      checked: this.checked
    });
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