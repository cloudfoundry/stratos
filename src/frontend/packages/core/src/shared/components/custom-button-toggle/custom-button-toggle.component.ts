import { Component, Input, Output, EventEmitter, forwardRef, ContentChildren, QueryList, AfterContentInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface MatButtonToggleChange {
  source: CustomButtonToggleComponent | CustomButtonToggleGroupComponent;
  value: any;
}

@Component({
  selector: 'app-button-toggle',
  template: '<button class="custom-button-toggle" [class.selected]="checked" [class.disabled]="disabled" (click)="toggle()" [disabled]="disabled"><ng-content></ng-content></button>',
  styleUrls: ['./custom-button-toggle.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class CustomButtonToggleComponent {
  @Input() value: any;
  @Input() disabled = false;
  @Input() checked = false;

  @Output() change = new EventEmitter<CustomButtonToggleComponent>();

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
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomButtonToggleGroupComponent),
      multi: true
    }
  ]
})
export class CustomButtonToggleGroupComponent implements ControlValueAccessor, AfterContentInit {
  @Input() multiple = false;
  @Input() disabled = false;
  @Input() vertical = false;
  @Input() name: string;

  @Output() valueChange = new EventEmitter<any>();
  @Output() change = new EventEmitter<MatButtonToggleChange>();

  @ContentChildren(CustomButtonToggleComponent) toggles: QueryList<CustomButtonToggleComponent>;

  selectedValues: any[] = [];

  private _onChange = (value: any) => {};
  private _onTouched = () => {};

  ngAfterContentInit() {
    this.toggles.forEach(toggle => {
      toggle.change.subscribe(selectedToggle => {
        this.selectToggle(selectedToggle);
      });
    });
  }

  selectToggle(toggle: CustomButtonToggleComponent) {
    if (toggle.disabled || this.disabled) return;

    this._onTouched();

    if (this.multiple) {
      const index = this.selectedValues.indexOf(toggle.value);
      if (index === -1) {
        this.selectedValues.push(toggle.value);
      } else {
        this.selectedValues.splice(index, 1);
      }
    } else {
      this.selectedValues = [toggle.value];
    }

    this.updateToggles();

    const value = this.multiple ? this.selectedValues : this.selectedValues[0];
    this._onChange(value);

    this.change.emit({
      source: this,
      value: value
    });

    this.valueChange.emit(value);
  }

  private updateToggles() {
    this.toggles.forEach(toggle => {
      toggle.checked = this.selectedValues.includes(toggle.value);
    });
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