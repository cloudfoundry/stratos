import { Component, Input, ContentChild, ElementRef, AfterContentInit, Directive, ChangeDetectorRef, OnDestroy, AfterViewInit, inject, ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { FormControl, NgControl } from '@angular/forms';

import { Subject, takeUntil } from 'rxjs';
import { CustomSelectComponent } from '../custom-select/custom-select.component';

@Component({
  selector: 'app-form-field',
  templateUrl: './custom-form-field.component.html',
  styleUrls: ['./custom-form-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: []
})
export class CustomFormFieldComponent implements AfterContentInit, AfterViewInit, OnDestroy {
  @Input() appearance: 'legacy' | 'standard' | 'fill' | 'outline' = 'standard';
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() floatLabel: 'always' | 'never' | 'auto' = 'always';
  @Input() hideRequiredMarker = false;
  @Input() hintLabel = '';

  @ContentChild(forwardRef(() => AppInputDirective), { read: ElementRef, static: false }) inputElement!: ElementRef;
  @ContentChild(CustomSelectComponent, { static: false }) selectComponent!: CustomSelectComponent;
  @ContentChild(NgControl, { static: false }) ngControl!: NgControl;

  public focused = false;
  public hasValue = false;
  public placeholder = '';
  public errorMessage = '';
  public isRequired = false;
  public inputId = '';

  private destroy$ = new Subject<void>();
  private isInitialized = false;

  private cdr = inject(ChangeDetectorRef);

  ngAfterContentInit() {
    // Handle app-select components
    if (this.selectComponent) {
      this.placeholder = this.selectComponent.placeholder || '';
      this.isRequired = this.selectComponent.required;
      this.inputId = this.selectComponent.id || this.selectComponent.name || `form-field-${Math.random().toString(36).substr(2, 9)}`;

      // Set select id if not present
      if (!this.selectComponent.id) {
        this.selectComponent.id = this.inputId;
      }

      // Monitor select value changes
      this.selectComponent.valueChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.hasValue = this.selectComponent.value != null &&
                       (Array.isArray(this.selectComponent.value) ? this.selectComponent.value.length > 0 : true);
        this.cdr.detectChanges();
      });

      // Initial value check
      this.hasValue = this.selectComponent.value != null &&
                     (Array.isArray(this.selectComponent.value) ? this.selectComponent.value.length > 0 : true);
    }
    // Handle native input/textarea/select elements
    else if (this.inputElement) {
      const input = this.inputElement.nativeElement;
      this.placeholder = input.placeholder || '';
      this.isRequired = input.required;
      this.inputId = input.id || `form-field-${Math.random().toString(36).substr(2, 9)}`;

      // Set input id if not present for label association
      if (!input.id) {
        input.id = this.inputId;
      }

      // Add ARIA attributes for accessibility
      input.setAttribute('aria-describedby', `${this.inputId}-hint`);
      if (this.isRequired) {
        input.setAttribute('aria-required', 'true');
      }

      // Listen for focus/blur events
      input.addEventListener('focus', () => {
        this.focused = true;
        this.cdr.detectChanges();
      });

      input.addEventListener('blur', () => {
        this.focused = false;
        this.updateErrorMessage();
        this.cdr.detectChanges();
      });

      // Listen for value changes
      input.addEventListener('input', () => {
        this.hasValue = input.value.length > 0;
        this.updateErrorMessage();
        this.cdr.detectChanges();
      });

      // Initial value check
      this.hasValue = input.value.length > 0;
    }

    // Listen to form control status changes if available
    if (this.ngControl && this.ngControl.statusChanges) {
      this.ngControl.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.updateErrorMessage();
        this.updateAriaAttributes();
        this.cdr.detectChanges();
      });
    }

    this.isInitialized = true;
  }

  ngAfterViewInit() {
    // Perform initial error check and ARIA update after view is fully initialized
    // This ensures all DOM elements and form controls are ready
    if (this.isInitialized) {
      // Re-read required state now that bindings from projected content have been applied
      if (this.inputElement) {
        this.isRequired = this.inputElement.nativeElement.required;
      }
      this.updateErrorMessage();
      this.updateAriaAttributes();
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get shouldFloatLabel(): boolean {
    return this.floatLabel === 'always' ||
           (this.floatLabel === 'auto' && (this.focused || this.hasValue));
  }

  get isInvalid(): boolean {
    if (!this.ngControl) return false;
    return !!(this.ngControl.invalid && this.ngControl.dirty);
  }

  get isValid(): boolean {
    if (!this.ngControl) return false;
    return !!(this.ngControl.valid && this.ngControl.dirty);
  }

  get isDisabled(): boolean {
    if (!this.ngControl) return false;
    return !!this.ngControl.disabled;
  }

  get hasPrefix(): boolean {
    // This will be set by parent component if prefix is provided
    return false; // Override in template with content projection check
  }

  private updateErrorMessage(): void {
    if (!this.ngControl || !this.ngControl.errors) {
      this.errorMessage = '';
      return;
    }

    const errors = this.ngControl.errors;

    if (errors['required']) {
      this.errorMessage = 'This field is required';
    } else if (errors['email']) {
      this.errorMessage = 'Please enter a valid email address';
    } else if (errors['minlength']) {
      this.errorMessage = `Minimum length is ${errors['minlength'].requiredLength} characters`;
    } else if (errors['maxlength']) {
      this.errorMessage = `Maximum length is ${errors['maxlength'].requiredLength} characters`;
    } else if (errors['min']) {
      this.errorMessage = `Minimum value is ${errors['min'].min}`;
    } else if (errors['max']) {
      this.errorMessage = `Maximum value is ${errors['max'].max}`;
    } else if (errors['pattern']) {
      this.errorMessage = 'Please enter a valid format';
    } else {
      // Generic error message for custom validators
      const firstError = Object.keys(errors)[0];
      this.errorMessage = errors[firstError]?.message || 'Invalid value';
    }
  }

  private updateAriaAttributes(): void {
    // For now, only update ARIA attributes for native input elements
    // The app-select component manages its own ARIA attributes
    if (!this.inputElement) return;

    const input = this.inputElement.nativeElement;

    if (this.isInvalid) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-errormessage', `${this.inputId}-error`);
    } else {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-errormessage');
    }
  }
}

@Component({
  selector: 'mat-icon',
  template: '<i class="material-icons"><ng-content></ng-content></i>',
  styleUrls: ['./custom-form-field.component.scss'],
  standalone: true
})
export class CustomFormFieldIconComponent {
  @Input() fontSet = 'material-icons';
  @Input() fontIcon!: string;
  @Input() svgIcon!: string;
}

@Component({
  selector: '[mat-icon-button]',
  template: '<ng-content></ng-content>',
  styleUrls: ['./custom-form-field.component.scss'],
  standalone: true,
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
  standalone: true,
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
  standalone: true,
  host: {
    'class': 'mat-input-element'
  }
})
export class MatInputDirective {
  @Input() formControl!: FormControl<any>;
  @Input() formControlName!: string;
}

@Directive({
  selector: '[appInput]',
  standalone: true,
  host: {
    'class': 'mat-input-element app-input-element'
  }
})
export class AppInputDirective {
  @Input() formControl!: FormControl<any>;
  @Input() formControlName!: string;
}

@Component({
  selector: '[matSuffix]',
  template: '',
  standalone: true,
  host: {
    'class': 'mat-form-field-suffix'
  }
})
export class MatSuffixDirective {
}

@Component({
  selector: 'app-label',
  template: '<label class="mat-form-field-label" [attr.for]="labelFor"><ng-content></ng-content></label>',
  styleUrls: ['./custom-form-field.component.scss'],
  standalone: true
})
export class MatLabelComponent {
  @Input() labelFor = '';
}

@Component({
  selector: 'app-error',
  template: '<div class="mat-error text-xs text-red-600 dark:text-red-400 mt-1"><ng-content></ng-content></div>',
  styleUrls: ['./custom-form-field.component.scss'],
  standalone: true
})
export class AppErrorComponent {
}

@Component({
  selector: 'mat-error',
  template: '<div class="mat-error text-xs text-red-600 dark:text-red-400 mt-1"><ng-content></ng-content></div>',
  styleUrls: ['./custom-form-field.component.scss'],
  standalone: true
})
export class MatErrorComponent {
}
