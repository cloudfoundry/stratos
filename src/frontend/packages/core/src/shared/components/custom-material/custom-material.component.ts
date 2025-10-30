import { Component, Input, Output, EventEmitter, Directive } from '@angular/core';

// Custom Icon Component
@Component({
  selector: 'app-custom-icon',
  template: `<i [class]="fontSet + ' custom-icon'" [class.inline]="inline" [attr.aria-label]="ariaLabel"><ng-content></ng-content></i>`,
  styleUrls: ['./custom-material.component.scss'],
  standalone: true
})
export class CustomIconComponent {
  @Input() fontSet = 'material-icons';
  @Input() fontIcon = '';
  @Input() svgIcon = '';
  @Input() inline = false;
  @Input() ariaLabel = '';
}

// Custom Spinner Component
@Component({
  selector: 'mat-spinner',
  template: '<div class="custom-spinner" [style.width.px]="diameter" [style.height.px]="diameter"><div class="spinner-circle"></div></div>',
  styleUrls: ['./custom-material.component.scss'],
  standalone: true
})
export class CustomSpinnerComponent {
  @Input() diameter = 40;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
}

// App Spinner Component removed - use AppSpinnerComponent from progress-spinner package instead

// Custom Progress Bar Component
@Component({
  selector: 'mat-progress-bar',
  template: '<div class="custom-progress-bar" [class.indeterminate]="mode === \'indeterminate\'"><div class="progress-fill" [style.width.%]="value"></div></div>',
  styleUrls: ['./custom-material.component.scss'],
  standalone: true
})
export class CustomProgressBarComponent {
  @Input() value = 0;
  @Input() mode: 'determinate' | 'indeterminate' | 'buffer' | 'query' = 'determinate';
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
}

// Custom Progress Bar Component with custom-progress-bar selector
@Component({
  selector: 'custom-progress-bar',
  template: '<div class="custom-progress-bar" [class.indeterminate]="mode === \'indeterminate\'"><div class="progress-fill" [style.width.%]="value"></div></div>',
  styleUrls: ['./custom-material.component.scss'],
  standalone: true
})
export class CustomProgressBarSelectorComponent {
  @Input() value = 0;
  @Input() mode: 'determinate' | 'indeterminate' | 'buffer' | 'query' = 'determinate';
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
}

// Custom Dialog Content Component
@Component({
  selector: 'mat-dialog-content',
  template: '<div class="custom-dialog-content"><ng-content></ng-content></div>',
  styleUrls: ['./custom-material.component.scss'],
  standalone: true
})
export class CustomDialogContentComponent {
}

// Custom Dialog Actions Component
@Component({
  selector: 'mat-dialog-actions',
  template: '<div class="custom-dialog-actions" [class.align-end]="align === \'end\'"><ng-content></ng-content></div>',
  styleUrls: ['./custom-material.component.scss'],
  standalone: true
})
export class CustomDialogActionsComponent {
  @Input() align: 'start' | 'center' | 'end' = 'start';
}

// Custom Dialog Title Component
@Component({
  selector: 'mat-dialog-title',
  template: '<div class="custom-dialog-title"><ng-content></ng-content></div>',
  styleUrls: ['./custom-material.component.scss'],
  standalone: true
})
export class CustomDialogTitleComponent {
}

// Datepicker directive for input binding (moved before usage)
@Directive({
  selector: '[matDatepicker]',
  standalone: true
})
export class MatDatepickerDirective {
  @Input() matDatepicker: any;
}

// Custom Datepicker Component (Basic)
@Component({
  selector: 'mat-datepicker',
  template: '<input type="date" class="custom-datepicker" [value]="selected" (change)="onDateChange($event)">',
  styleUrls: ['./custom-material.component.scss'],
  standalone: true
})
export class CustomDatepickerComponent {
  @Input() selected: Date;
  @Output() selectedChange = new EventEmitter<Date>();

  onDateChange(event: any) {
    const date = new Date(event.target.value);
    this.selected = date;
    this.selectedChange.emit(date);
  }
}

// Custom Datepicker Input Component
@Component({
  selector: 'mat-datepicker-input',
  template: '<input class="custom-datepicker-input" [matDatepicker]="matDatepicker" [value]="value" (input)="onInput($event)">',
  styleUrls: ['./custom-material.component.scss'],
  standalone: true,
  imports: [MatDatepickerDirective]
})
export class CustomDatepickerInputComponent {
  @Input() matDatepicker: any;
  @Output() valueChange = new EventEmitter<Date>();
  private _value: Date;

  @Input()
  get value(): Date {
    return this._value;
  }
  set value(val: Date) {
    this._value = val;
  }

  onInput(event: any) {
    const date = new Date(event.target.value);
    this.value = date;
    this.valueChange.emit(date);
  }
}

// Custom Datepicker Toggle Component
@Component({
  selector: 'mat-datepicker-toggle',
  template: '<button class="custom-datepicker-toggle" (click)="toggle()"><app-custom-icon>calendar_today</app-custom-icon></button>',
  styleUrls: ['./custom-material.component.scss'],
  standalone: true,
  imports: [CustomIconComponent]
})
export class CustomDatepickerToggleComponent {
  @Input() for: any;

  toggle() {
    if (this.for && this.for.open) {
      this.for.open();
    }
  }
}