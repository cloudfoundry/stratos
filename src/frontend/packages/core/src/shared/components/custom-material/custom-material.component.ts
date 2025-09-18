import { Component, Input, Output, EventEmitter } from '@angular/core';

// Custom Icon Component
@Component({
  selector: 'mat-icon',
  template: '<i class="custom-icon" [class]="fontSet + ' ' + name" [attr.aria-label]="ariaLabel"><ng-content></ng-content></i>',
  styleUrls: ['./custom-material.component.scss'],
  standalone: false
})
export class CustomIconComponent {
  @Input() fontSet = 'material-icons';
  @Input() fontIcon = '';
  @Input() svgIcon = '';
  @Input() inline = false;
  @Input() ariaLabel = '';

  get name(): string {
    return this.fontIcon || '';
  }
}

// Custom Progress Bar Component
@Component({
  selector: 'mat-progress-bar',
  template: '<div class="custom-progress-bar" [class.indeterminate]="mode === \'indeterminate\'"><div class="progress-fill" [style.width.%]="value"></div></div>',
  styleUrls: ['./custom-material.component.scss'],
  standalone: false
})
export class CustomProgressBarComponent {
  @Input() value = 0;
  @Input() mode: 'determinate' | 'indeterminate' | 'buffer' | 'query' = 'determinate';
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
}

// Custom Dialog Content Component
@Component({
  selector: 'mat-dialog-content',
  template: '<div class="custom-dialog-content"><ng-content></ng-content></div>',
  styleUrls: ['./custom-material.component.scss'],
  standalone: false
})
export class CustomDialogContentComponent {
}

// Custom Dialog Actions Component
@Component({
  selector: 'mat-dialog-actions',
  template: '<div class="custom-dialog-actions" [class.align-end]="align === \'end\'"><ng-content></ng-content></div>',
  styleUrls: ['./custom-material.component.scss'],
  standalone: false
})
export class CustomDialogActionsComponent {
  @Input() align: 'start' | 'center' | 'end' = 'start';
}

// Custom Dialog Title Component
@Component({
  selector: 'mat-dialog-title',
  template: '<div class="custom-dialog-title"><ng-content></ng-content></div>',
  styleUrls: ['./custom-material.component.scss'],
  standalone: false
})
export class CustomDialogTitleComponent {
}

// Custom Datepicker Component (Basic)
@Component({
  selector: 'mat-datepicker',
  template: '<input type="date" class="custom-datepicker" [value]="selected" (change)="onDateChange($event)">',
  styleUrls: ['./custom-material.component.scss'],
  standalone: false
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
  template: '<input class="custom-datepicker-input" [matDatepicker]="datepicker" [value]="value" (input)="onInput($event)">',
  styleUrls: ['./custom-material.component.scss'],
  standalone: false
})
export class CustomDatepickerInputComponent {
  @Input() matDatepicker: any;
  @Input() value: Date;
  @Output() valueChange = new EventEmitter<Date>();

  onInput(event: any) {
    const date = new Date(event.target.value);
    this.value = date;
    this.valueChange.emit(date);
  }
}

// Custom Datepicker Toggle Component
@Component({
  selector: 'mat-datepicker-toggle',
  template: '<button class="custom-datepicker-toggle" (click)="toggle()"><mat-icon>calendar_today</mat-icon></button>',
  styleUrls: ['./custom-material.component.scss'],
  standalone: false
})
export class CustomDatepickerToggleComponent {
  @Input() for: any;

  toggle() {
    if (this.for && this.for.open) {
      this.for.open();
    }
  }
}