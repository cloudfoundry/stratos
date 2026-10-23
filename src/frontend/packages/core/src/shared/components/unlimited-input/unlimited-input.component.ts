import {
  Component,
  Input,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  input
} from "@angular/core";
import {
  AbstractControl,
  ControlContainer,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import {
  CustomCheckboxComponent,
  MatCheckboxChange,
} from "../custom-checkbox/custom-checkbox.component";
import {
  AppInputDirective,
  CustomFormFieldComponent,
} from "../custom-form-field/custom-form-field.component";
import { CF_QUOTA_UNLIMITED } from "../../../core/cf-quota.types";

@Component({
  selector: "app-unlimited-input",
  templateUrl: "./unlimited-input.component.html",
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: FormGroupDirective,
    },
  ],
  standalone: true,
  host: { class: "block" },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    AppInputDirective,
    CustomFormFieldComponent,
    CustomCheckboxComponent,
  ],
})
export class UnlimitedInputComponent implements OnInit {
  public ctrlContainer = inject(FormGroupDirective);

  // The form control to drive; every host names one.
  readonly name = input.required<string>();
  readonly value = input<any>();
  readonly required = input(false);
  readonly type = input<string>();
  readonly placeholder = input('');
  @Input() suffix!: string;
  readonly prefix = input<string>();

  unlimited = false;
  formControl!: AbstractControl;
  initialValue: any;

  onCheckboxChange(event: MatCheckboxChange) {
    this.unlimited = event.checked;
    this.onChange();
  }

  onChange() {
    if (this.unlimited) {
      this.initialValue = this.formControl.value;
      this.formControl.setValue("");
      this.formControl.disable();
    } else {
      this.formControl.enable();
      if (this.initialValue !== CF_QUOTA_UNLIMITED && this.initialValue != null) {
        this.formControl.patchValue(this.initialValue);
      } else {
        this.formControl.setValue("");
      }
    }
  }

  ngOnInit() {
    this.formControl = this.ctrlContainer.form.get(this.name())!;
    this.formControl.setValidators(Validators.min(0));

    if (this.formControl.value) {
      this.setInitialValues(this.formControl.value);
    }
  }

  setInitialValues(value: any) {
    this.initialValue = value;
    this.unlimited = value === CF_QUOTA_UNLIMITED;
    this.onChange();
  }
}
