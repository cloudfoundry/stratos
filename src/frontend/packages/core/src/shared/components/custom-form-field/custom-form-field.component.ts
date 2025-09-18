import { Component, Input, ContentChild, ElementRef, AfterContentInit, Directive } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'mat-form-field',
  templateUrl: './custom-form-field.component.html',
  styleUrls: ['./custom-form-field.component.scss'],
  standalone: false
})
export class CustomFormFieldComponent implements AfterContentInit {
  @Input() appearance: 'legacy' | 'standard' | 'fill' | 'outline' = 'standard';
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() floatLabel: 'always' | 'never' | 'auto' = 'auto';
  @Input() hideRequiredMarker = false;
  @Input() hintLabel = '';

  @ContentChild('input', { read: ElementRef, static: false }) inputElement: ElementRef;

  public focused = false;
  public hasValue = false;
  public placeholder = '';

  ngAfterContentInit() {
    if (this.inputElement) {
      const input = this.inputElement.nativeElement;
      this.placeholder = input.placeholder || '';
      
      // Listen for focus/blur events
      input.addEventListener('focus', () => {
        this.focused = true;
      });
      
      input.addEventListener('blur', () => {
        this.focused = false;
      });
      
      // Listen for value changes
      input.addEventListener('input', () => {
        this.hasValue = input.value.length > 0;
      });
      
      // Initial value check
      this.hasValue = input.value.length > 0;
    }
  }

  get shouldFloatLabel(): boolean {
    return this.floatLabel === 'always' || 
           (this.floatLabel === 'auto' && (this.focused || this.hasValue));
  }
}

@Component({
  selector: 'mat-icon',
  template: '<i class="material-icons"><ng-content></ng-content></i>',
  styleUrls: ['./custom-form-field.component.scss'],
  standalone: false
})
export class CustomFormFieldIconComponent {
  @Input() fontSet = 'material-icons';
  @Input() fontIcon: string;
  @Input() svgIcon: string;
}

@Component({
  selector: '[mat-icon-button]',
  template: '<ng-content></ng-content>',
  styleUrls: ['./custom-form-field.component.scss'],
  standalone: false,
  host: {
    'class': 'mat-icon-button',
    '[class.mat-button-disabled]': 'disabled',
    '[attr.disabled]': 'disabled || null'
  }
})
export class CustomIconButtonDirective {
  @Input() disabled = false;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
}

@Component({
  selector: '[mat-button]',
  template: '<ng-content></ng-content>',
  styleUrls: ['./custom-form-field.component.scss'],
  standalone: false,
  host: {
    'class': 'mat-button',
    '[class.mat-button-disabled]': 'disabled',
    '[attr.disabled]': 'disabled || null'
  }
})
export class CustomButtonDirective {
  @Input() disabled = false;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
}

@Directive({
  selector: '[matInput]',
  standalone: false,
  host: {
    'class': 'mat-input-element'
  }
})
export class MatInputDirective {
  @Input() formControl: FormControl;
  @Input() formControlName: string;
}

@Component({
  selector: '[matSuffix]',
  template: '',
  standalone: false,
  host: {
    'class': 'mat-form-field-suffix'
  }
})
export class MatSuffixDirective {
}
