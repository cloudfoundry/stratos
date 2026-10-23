import { ChangeDetectionStrategy, Component, Input, forwardRef, ContentChildren, QueryList, AfterContentInit, input, output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';


export interface MatButtonToggleChange {
  source: CustomButtonToggleComponent | CustomButtonToggleGroupComponent;
  value: any;
}

@Component({
  selector: 'app-button-toggle',
  template: '<button class="custom-button-toggle" [class.selected]="checked" [class.disabled]="disabled" (click)="toggle()" [disabled]="disabled"><ng-content></ng-content></button>',
  styleUrls: ['./custom-button-toggle.component.scss'],
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomButtonToggleComponent {
  readonly value = input<any>();
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input() disabled = false;
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input() checked = false;

  // eslint-disable-next-line @angular-eslint/no-output-native -- intentional Material API parity: drop-in for mat-button-toggle which emits (change)
  readonly change = output<CustomButtonToggleComponent>();

  toggle() {
    if (this.disabled) return;
    this.change.emit(this);
  }
}

@Component({
  selector: 'app-button-toggle-group',
  templateUrl: './custom-button-toggle-group.component.html',
  styleUrls: ['./custom-button-toggle.component.scss'],
  standalone: true,
  imports: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomButtonToggleGroupComponent),
      multi: true,
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomButtonToggleGroupComponent implements ControlValueAccessor, AfterContentInit {
  readonly multiple = input(false);
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input() disabled = false;
  readonly vertical = input(false);
  readonly name = input.required<string>();

  // Material API parity: mat-button-toggle-group supports a plain [value] input
  // TODO: Skipped for migration because:
  //  Accessor inputs cannot be migrated as they are too complex.
  @Input()
  set value(value: any) {
    this.writeValue(value);
  }
  get value(): any {
    return this.multiple() ? this.selectedValues : this.selectedValues[0];
  }

  readonly valueChange = output<any>();
  // eslint-disable-next-line @angular-eslint/no-output-native -- intentional Material API parity: drop-in for mat-button-toggle-group which emits (change)
  readonly change = output<MatButtonToggleChange>();

  // strict: @ContentChildren is populated by Angular before ngAfterContentInit
  @ContentChildren(CustomButtonToggleComponent) toggles!: QueryList<CustomButtonToggleComponent>;

  selectedValues: any[] = [];

  private _onChange = (_value: any) => {};
  private _onTouched = () => {};

  ngAfterContentInit() {
    this.toggles.forEach(toggle => {
      toggle.change.subscribe(selectedToggle => {
        this.selectToggle(selectedToggle);
      });
    });
    // Reflect any value written before the toggles were available
    this.updateToggles();
  }

  selectToggle(toggle: CustomButtonToggleComponent) {
    if (toggle.disabled || this.disabled) return;

    this._onTouched();

    const multiple = this.multiple();
    if (multiple) {
      const index = this.selectedValues.indexOf(toggle.value());
      if (index === -1) {
        this.selectedValues.push(toggle.value());
      } else {
        this.selectedValues.splice(index, 1);
      }
    } else {
      this.selectedValues = [toggle.value()];
    }

    this.updateToggles();

    const value = multiple ? this.selectedValues : this.selectedValues[0];
    this._onChange(value);

    this.change.emit({
      source: this,
      value: value
    });

    this.valueChange.emit(value);
  }

  private updateToggles() {
    if (!this.toggles) {
      // writeValue can run before content children are resolved
      return;
    }
    this.toggles.forEach(toggle => {
      toggle.checked = this.selectedValues.includes(toggle.value());
    });
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    const multiple = this.multiple();
    if (multiple && Array.isArray(value)) {
      this.selectedValues = value;
    } else if (!multiple && value !== undefined) {
      this.selectedValues = [value];
    } else {
      this.selectedValues = [];
    }
    this.updateToggles();
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.toggles) {
      this.toggles.forEach(toggle => {
        toggle.disabled = isDisabled;
      });
    }
  }
}