import {
  Component,
  Input,
  ContentChild,
  ElementRef,
  AfterContentInit,
  Directive,
  ChangeDetectorRef,
  OnDestroy,
  AfterViewInit,
  inject,
  ChangeDetectionStrategy,
  forwardRef,
} from "@angular/core";
import { FormControl, NgControl } from "@angular/forms";

import { Subject, takeUntil } from "rxjs";
import { CustomSelectComponent } from "../custom-select/custom-select.component";

/*
 * FormControl + signal bridge pattern (FWT-956)
 * ──────────────────────────────────────────────
 * The signal-native detail / list / stepper primitives consume validity,
 * value, and disabled state as Angular signals. Forms in this codebase still
 * use Angular's `FormControl` / `FormGroup` (not switching to a custom
 * primitive — see design-doc Q4). Bridge between the two using `toSignal`:
 *
 *   import { toSignal } from '@angular/core/rxjs-interop';
 *
 *   class MyForm {
 *     form = new FormGroup({
 *       email: new FormControl('', [Validators.required, Validators.email]),
 *     });
 *     // Reactive validity for buttons / step handles / detail actions:
 *     valid = toSignal(this.form.statusChanges.pipe(map(() => this.form.valid)),
 *                      { initialValue: this.form.valid });
 *     // Reactive value when the consumer needs to react (e.g. enabling a
 *     // dependent field, re-running validators):
 *     value = toSignal(this.form.valueChanges, { initialValue: this.form.value });
 *
 *     // Compose into <app-signal-detail> headerActions / SignalStepHandle:
 *     headerActions = [{
 *       label: 'Save',
 *       primary: true,
 *       disabled: computed(() => !this.valid()),
 *       invoke: async () => {
 *         if (!this.valid()) return;
 *         await this.service.save(this.form.getRawValue());
 *       },
 *     }];
 *   }
 *
 * The bridge is intentionally one-way (form → signal). For two-way binding
 * the FormControl is still the source of truth — write back via
 * `formControl.setValue(...)`, not the signal.
 *
 * NOTE on `<app-form-field>` itself: this is a Tailwind-styled wrapper that
 * also shims Material's `<mat-form-field>` / `[matInput]` / `[mat-button]`
 * selectors so legacy templates continue to compile after Material was
 * removed. The wrapper does NOT need any signal-handle plumbing — it works
 * with any `NgControl` (FormControl, NgModel) via the projected content
 * directive resolution.
 */

@Component({
  selector: "app-form-field",
  templateUrl: "./custom-form-field.component.html",
  styleUrls: ["./custom-form-field.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [],
  host: { class: "block" },
})
export class CustomFormFieldComponent
  implements AfterContentInit, AfterViewInit, OnDestroy
{
  @Input() appearance: "legacy" | "standard" | "fill" | "outline" = "standard";
  @Input() color: "primary" | "accent" | "warn" = "primary";
  @Input() floatLabel: "always" | "never" | "auto" = "always";
  @Input() hideRequiredMarker = false;
  @Input() hintLabel = "";

  /**
   * When true, the prefix/infix/suffix flex row shrinks to its content
   * (`w-max`) instead of filling the host (`w-full`). The underline below
   * the row keeps the host's width — so a consumer can set e.g.
   * `<app-form-field class="w-1/2" [fitContent]="true">` to get a
   * content-width trigger sitting above a 50% underline.
   */
  @Input() fitContent = false;

  @ContentChild(forwardRef(() => AppInputDirective), {
    read: ElementRef,
    static: false,
  })
  inputElement!: ElementRef;
  @ContentChild(CustomSelectComponent, { static: false })
  selectComponent!: CustomSelectComponent;
  @ContentChild(NgControl, { static: false }) ngControl!: NgControl;

  public focused = false;
  public hasValue = false;
  public placeholder = "";
  public errorMessage = "";
  public isRequired = false;
  public inputId = "";

  private destroy$ = new Subject<void>();
  private isInitialized = false;

  private cdr = inject(ChangeDetectorRef);

  ngAfterContentInit() {
    // Handle app-select components
    if (this.selectComponent) {
      this.placeholder = this.selectComponent.placeholder || "";
      this.isRequired = this.selectComponent.required;
      this.inputId =
        this.selectComponent.id ||
        this.selectComponent.name ||
        `form-field-${Math.random().toString(36).substr(2, 9)}`;

      // Set select id if not present
      if (!this.selectComponent.id) {
        this.selectComponent.id = this.inputId;
      }

      // Monitor select value changes
      this.selectComponent.valueChange
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.hasValue =
            this.selectComponent.value != null &&
            (Array.isArray(this.selectComponent.value)
              ? this.selectComponent.value.length > 0
              : true);
          this.cdr.detectChanges();
        });

      // Initial value check
      this.hasValue =
        this.selectComponent.value != null &&
        (Array.isArray(this.selectComponent.value)
          ? this.selectComponent.value.length > 0
          : true);
    }
    // Handle native input/textarea/select elements
    else if (this.inputElement) {
      const input = this.inputElement.nativeElement;
      this.placeholder = input.placeholder || "";
      this.isRequired = input.required;
      this.inputId =
        input.id || `form-field-${Math.random().toString(36).substr(2, 9)}`;

      // Set input id if not present for label association
      if (!input.id) {
        input.id = this.inputId;
      }

      // Add ARIA attributes for accessibility
      input.setAttribute("aria-describedby", `${this.inputId}-hint`);
      if (this.isRequired) {
        input.setAttribute("aria-required", "true");
      }

      // Listen for focus/blur events
      input.addEventListener("focus", () => {
        this.focused = true;
        this.cdr.detectChanges();
      });

      input.addEventListener("blur", () => {
        this.focused = false;
        this.updateErrorMessage();
        this.cdr.detectChanges();
      });

      // Listen for value changes
      input.addEventListener("input", () => {
        this.hasValue = input.value.length > 0;
        this.updateErrorMessage();
        this.cdr.detectChanges();
      });

      // Initial value check
      this.hasValue = input.value.length > 0;
    }

    // Listen to form control status changes if available
    if (this.ngControl && this.ngControl.statusChanges) {
      this.ngControl.statusChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
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
    return (
      this.floatLabel === "always" ||
      (this.floatLabel === "auto" && (this.focused || this.hasValue))
    );
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

  /**
   * Tailwind class string for prefix and suffix containers. Replaces the
   * SCSS `.form-field-prefix` / `.form-field-suffix` parent-state-driven
   * color rules so the same logic lives in one place (the template binding)
   * instead of being split between SCSS descendant combinators and the host
   * class list.
   */
  get prefixSuffixColorClasses(): string {
    if (this.isInvalid) return "text-danger";
    if (this.isValid) return "text-success";
    if (this.focused) return "text-input-focus-border";
    return "text-content-muted";
  }

  /**
   * Tailwind class string for the underline bar (standard / legacy
   * appearances). Replaces the SCSS `.form-field-underline` rules.
   */
  get underlineColorClasses(): string {
    if (this.isInvalid) return "bg-danger";
    if (this.isValid) return "bg-success";
    if (this.focused) return "bg-transparent";
    return "bg-input-border";
  }

  /**
   * Tailwind class string for the focus-ripple overlay. Replaces the SCSS
   * `.form-field-ripple` color + scale-on-focus rules.
   */
  get rippleColorClasses(): string {
    const transform = this.focused ? "scale-x-100" : "scale-x-0";
    let bg: string;
    if (this.isInvalid || this.color === "warn") bg = "bg-danger";
    else if (this.isValid) bg = "bg-success";
    else if (this.color === "accent") bg = "bg-accent";
    else bg = "bg-input-focus-border";
    return `${bg} ${transform}`;
  }

  /**
   * Tailwind class string for the floating label. Encodes layout, size,
   * and state-dependent color in one binding so the SCSS doesn't need any
   * rules for the label anymore.
   */
  get labelClasses(): string {
    const base =
      "absolute left-0 top-1 pointer-events-none select-none origin-top-left";
    const sizing = this.shouldFloatLabel
      ? "-translate-y-[1.8em] text-xs font-medium"
      : "text-base leading-tight";
    let color: string;
    if (this.isInvalid) {
      color = "text-danger";
    } else if (this.isValid) {
      color = "text-success";
    } else if (this.focused) {
      color = "text-input-focus-border";
    } else if (this.shouldFloatLabel) {
      color = "text-primary";
    } else {
      color = "text-input-placeholder";
    }
    return `${base} ${sizing} ${color}`;
  }

  private updateErrorMessage(): void {
    if (!this.ngControl || !this.ngControl.errors) {
      this.errorMessage = "";
      return;
    }

    const errors = this.ngControl.errors;

    if (errors["required"]) {
      this.errorMessage = "This field is required";
    } else if (errors["email"]) {
      this.errorMessage = "Please enter a valid email address";
    } else if (errors["minlength"]) {
      this.errorMessage = `Minimum length is ${errors["minlength"].requiredLength} characters`;
    } else if (errors["maxlength"]) {
      this.errorMessage = `Maximum length is ${errors["maxlength"].requiredLength} characters`;
    } else if (errors["min"]) {
      this.errorMessage = `Minimum value is ${errors["min"].min}`;
    } else if (errors["max"]) {
      this.errorMessage = `Maximum value is ${errors["max"].max}`;
    } else if (errors["pattern"]) {
      this.errorMessage = "Please enter a valid format";
    } else {
      // Generic error message for custom validators
      const firstError = Object.keys(errors)[0];
      this.errorMessage = errors[firstError]?.message || "Invalid value";
    }
  }

  private updateAriaAttributes(): void {
    // For now, only update ARIA attributes for native input elements
    // The app-select component manages its own ARIA attributes
    if (!this.inputElement) return;

    const input = this.inputElement.nativeElement;

    if (this.isInvalid) {
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-errormessage", `${this.inputId}-error`);
    } else {
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-errormessage");
    }
  }
}

@Component({
  selector: "mat-icon",
  template: '<i class="material-icons"><ng-content></ng-content></i>',
  styleUrls: ["./custom-form-field.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class CustomFormFieldIconComponent {
  @Input() fontSet = "material-icons";
  @Input() fontIcon!: string;
  @Input() svgIcon!: string;
}

@Component({
  selector: "[mat-icon-button]",
  template: "<ng-content></ng-content>",
  styleUrls: ["./custom-form-field.component.scss"],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "mat-icon-button",
    "[class.mat-button-disabled]": "disabled",
    "[attr.disabled]": "disabled || null",
  },
})
export class CustomIconButtonDirective {
  @Input() disabled = false;
  @Input() color: "primary" | "accent" | "warn" = "primary";
}

@Component({
  selector: "[mat-button]",
  template: "<ng-content></ng-content>",
  styleUrls: ["./custom-form-field.component.scss"],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "mat-button",
    "[class.mat-button-disabled]": "disabled",
    "[attr.disabled]": "disabled || null",
  },
})
export class CustomButtonDirective {
  @Input() disabled = false;
  @Input() color: "primary" | "accent" | "warn" = "primary";
}

@Directive({
  selector: "[matInput]",
  standalone: true,
  host: {
    class: "mat-input-element",
  },
})
export class MatInputDirective {
  @Input() formControl!: FormControl<any>;
  @Input() formControlName!: string;
}

@Directive({
  selector: "[appInput]",
  standalone: true,
  host: {
    class: "mat-input-element app-input-element",
  },
})
export class AppInputDirective {
  @Input() formControl!: FormControl<any>;
  @Input() formControlName!: string;
}

@Component({
  selector: "[matSuffix]",
  template: "",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "mat-form-field-suffix",
  },
})
export class MatSuffixDirective {}

@Component({
  selector: "app-label",
  template:
    '<label class="mat-form-field-label" [attr.for]="labelFor"><ng-content></ng-content></label>',
  styleUrls: ["./custom-form-field.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class MatLabelComponent {
  @Input() labelFor = "";
}

@Component({
  selector: "app-error",
  template:
    '<div class="mat-error text-xs text-red-600 dark:text-red-400 mt-1"><ng-content></ng-content></div>',
  styleUrls: ["./custom-form-field.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class AppErrorComponent {}

@Component({
  selector: "mat-error",
  template:
    '<div class="mat-error text-xs text-red-600 dark:text-red-400 mt-1"><ng-content></ng-content></div>',
  styleUrls: ["./custom-form-field.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class MatErrorComponent {}
