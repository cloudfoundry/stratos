import { ChangeDetectionStrategy, Component, Input, Directive, booleanAttribute, input, output } from '@angular/core';

// Custom Icon Component
@Component({
  selector: 'app-custom-icon',
  template: `<i [class]="(fontSet() || 'material-icons') + ' custom-icon'" [class.inline]="inline()" [attr.aria-label]="ariaLabel()"><ng-content></ng-content></i>`,
  styleUrls: ['./custom-material.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomIconComponent {
  // Undefined falls back to material-icons so callers can bind optional fonts
  readonly fontSet = input<string | undefined>('material-icons');
  readonly fontIcon = input('');
  readonly svgIcon = input('');
  // Attribute form (inline / inline="true") coerces like mat-icon did
  readonly inline = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input('');
}

// Custom Spinner Component
@Component({
  selector: 'mat-spinner',
  template: '<div class="custom-spinner" [style.width.px]="diameter()" [style.height.px]="diameter()"><div class="spinner-circle"></div></div>',
  styleUrls: ['./custom-material.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomSpinnerComponent {
  readonly diameter = input(40);
  readonly color = input<'primary' | 'accent' | 'warn'>('primary');
}

// App Spinner Component removed - use AppSpinnerComponent from progress-spinner package instead

// Custom Progress Bar Component
@Component({
  selector: 'mat-progress-bar',
  template: '<div class="custom-progress-bar" [class.indeterminate]="mode() === \'indeterminate\'"><div class="progress-fill" [style.width.%]="value()"></div></div>',
  styleUrls: ['./custom-material.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomProgressBarComponent {
  readonly value = input(0);
  readonly mode = input<'determinate' | 'indeterminate' | 'buffer' | 'query'>('determinate');
  readonly color = input<'primary' | 'accent' | 'warn'>('primary');
}

// Custom Progress Bar Component with custom-progress-bar selector
@Component({
  selector: 'custom-progress-bar',
  template: '<div class="custom-progress-bar" [class.indeterminate]="mode() === \'indeterminate\'"><div class="progress-fill" [style.width.%]="value()"></div></div>',
  styleUrls: ['./custom-material.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomProgressBarSelectorComponent {
  readonly value = input(0);
  readonly mode = input<'determinate' | 'indeterminate' | 'buffer' | 'query'>('determinate');
  readonly color = input<'primary' | 'accent' | 'warn'>('primary');
}

// Custom Dialog Content Component
@Component({
  selector: 'mat-dialog-content',
  template: '<div class="custom-dialog-content"><ng-content></ng-content></div>',
  styleUrls: ['./custom-material.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomDialogContentComponent {
}

// Custom Dialog Actions Component
@Component({
  selector: 'mat-dialog-actions',
  template: '<div class="custom-dialog-actions" [class.align-end]="align() === \'end\'"><ng-content></ng-content></div>',
  styleUrls: ['./custom-material.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomDialogActionsComponent {
  readonly align = input<'start' | 'center' | 'end'>('start');
}

// Custom Dialog Title Component
@Component({
  selector: 'mat-dialog-title',
  template: '<div class="custom-dialog-title"><ng-content></ng-content></div>',
  styleUrls: ['./custom-material.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomDialogTitleComponent {
}

// Datepicker directive for input binding (moved before usage)
@Directive({
  selector: '[matDatepicker]',
  standalone: true
})
export class MatDatepickerDirective {
  readonly matDatepicker = input<any>();
}

// Custom Datepicker Component (Basic)
@Component({
  selector: 'mat-datepicker',
  template: '<input type="date" class="custom-datepicker" [value]="selected" (change)="onDateChange($event)">',
  styleUrls: ['./custom-material.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomDatepickerComponent {
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input() selected!: Date;
  readonly selectedChange = output<Date>();

  onDateChange(event: any) {
    const date = new Date(event.target.value);
    this.selected = date;
    this.selectedChange.emit(date);
  }
}

// Custom Datepicker Input Component
@Component({
  selector: 'mat-datepicker-input',
  template: '<input class="custom-datepicker-input" [matDatepicker]="matDatepicker()" [value]="value" (input)="onInput($event)">',
  styleUrls: ['./custom-material.component.scss'],
  standalone: true,
  imports: [MatDatepickerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomDatepickerInputComponent {
  readonly matDatepicker = input<any>();
  readonly valueChange = output<Date>();
  private _value!: Date;

  // TODO: Skipped for migration because:
  //  Accessor inputs cannot be migrated as they are too complex.
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
  imports: [CustomIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomDatepickerToggleComponent {
  readonly for = input<any>();

  toggle() {
    const picker = this.for();
    if (picker && picker.open) {
      picker.open();
    }
  }
}