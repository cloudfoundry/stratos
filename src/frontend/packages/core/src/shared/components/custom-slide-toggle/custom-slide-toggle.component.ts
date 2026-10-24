import { ChangeDetectionStrategy, Component, Input, forwardRef, input, output, ChangeDetectorRef, inject } from '@angular/core';
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
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() disabled = false;
  @Input() checked = false;
  readonly value = input<any>();
  readonly name = input<string>();
  readonly id = input<string>();
  readonly required = input(false);
  readonly labelPosition = input<'before' | 'after'>('after');
  readonly color = input<'primary' | 'accent' | 'warn'>('primary');
  readonly invalid = input(false);
  @Input() errorMessage = '';

  // eslint-disable-next-line @angular-eslint/no-output-native -- intentional Material API parity: drop-in for mat-slide-toggle which emits (change)
  readonly change = output<MatSlideToggleChange>();

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
  // The form calls these from code, not through a binding, so under OnPush
  // the view must be marked for check.
  writeValue(value: boolean): void {
    this.checked = value;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }
}