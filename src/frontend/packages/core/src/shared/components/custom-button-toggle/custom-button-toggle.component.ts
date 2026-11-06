import { ChangeDetectionStrategy, Component, forwardRef, AfterContentInit, effect, input, model, output, untracked, contentChildren } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';


export interface MatButtonToggleChange {
  source: CustomButtonToggleComponent | CustomButtonToggleGroupComponent;
  value: any;
}

@Component({
  selector: 'app-button-toggle',
  template: '<button class="custom-button-toggle" [class.selected]="checked()" [class.disabled]="disabled()" (click)="toggle()" [disabled]="disabled()"><ng-content></ng-content></button>',
  styleUrls: ['./custom-button-toggle.component.scss'],
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomButtonToggleComponent {
  readonly value = input<any>();
  // Models: a parent can bind them, and the group writes them from code.
  readonly disabled = model(false);
  readonly checked = model(false);

  // eslint-disable-next-line @angular-eslint/no-output-native -- intentional Material API parity: drop-in for mat-button-toggle which emits (change)
  readonly change = output<CustomButtonToggleComponent>();

  toggle() {
    if (this.disabled()) return;
    this.change.emit(this);
  }

  // The group sets checked and disabled from code.
  setState(checked: boolean, disabled: boolean) {
    this.checked.set(checked);
    this.disabled.set(disabled);
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
  // A model: a parent binds it and the form disables the group through it.
  readonly disabled = model(false);
  readonly vertical = input(false);
  readonly name = input<string>();

  // Material API parity: mat-button-toggle-group supports a plain [value]
  // input. It is the value a parent binds; the selection the group holds is
  // in selectedValues.
  readonly value = input<any>();

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
  }

  readonly valueChange = output<any>();
  // eslint-disable-next-line @angular-eslint/no-output-native -- intentional Material API parity: drop-in for mat-button-toggle-group which emits (change)
  readonly change = output<MatButtonToggleChange>();

  // strict: @ContentChildren is populated by Angular before ngAfterContentInit
  readonly toggles = contentChildren(CustomButtonToggleComponent);

  selectedValues: any[] = [];

  private _onChange = (_value: any) => {};
  private _onTouched = () => {};

  ngAfterContentInit() {
    this.toggles().forEach(toggle => {
      toggle.change.subscribe(selectedToggle => {
        this.selectToggle(selectedToggle);
      });
    });
    // Reflect any value written before the toggles were available
    this.updateToggles();
  }

  selectToggle(toggle: CustomButtonToggleComponent) {
    if (toggle.disabled() || this.disabled()) return;

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
    const toggles = this.toggles();
    if (!toggles) {
      // writeValue can run before content children are resolved
      return;
    }
    toggles.forEach(toggle => {
      toggle.setState(this.selectedValues.includes(toggle.value()), toggle.disabled());
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
    this.disabled.set(isDisabled);
    const toggles = this.toggles();
    if (toggles) {
      toggles.forEach(toggle => {
        toggle.setState(toggle.checked(), isDisabled);
      });
    }
  }
}