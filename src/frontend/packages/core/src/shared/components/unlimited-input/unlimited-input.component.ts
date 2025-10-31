
import { Component, Input, OnInit, inject } from '@angular/core';
import { AbstractControl, ControlContainer, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomCheckboxComponent } from '../custom-checkbox/custom-checkbox.component';
import { CustomFormFieldComponent } from '../custom-form-field/custom-form-field.component';

const UNLIMITED = -1;

@Component({
  selector: 'app-unlimited-input',
  templateUrl: './unlimited-input.component.html',
  styleUrls: ['./unlimited-input.component.scss'],
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: FormGroupDirective
    }
  ],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CustomFormFieldComponent,
    CustomCheckboxComponent
]
})
export class UnlimitedInputComponent implements OnInit {
  public ctrlContainer = inject(FormGroupDirective);

  @Input() name: string;
  @Input() value: any;
  @Input() required: boolean;
  @Input() type: string;
  @Input() placeholder: string;
  @Input() suffix: string;
  @Input() prefix: string;

  unlimited: boolean;
  formControl: AbstractControl;
  initialValue: any;

  onChange() {
    if (this.unlimited) {
      this.initialValue = this.formControl.value;
      this.formControl.setValue('');
      this.formControl.disable();
    } else {
      if (this.initialValue !== UNLIMITED) {
        this.formControl.patchValue(this.initialValue);
      }
      this.formControl.enable();
    }
  }

  ngOnInit() {
    this.formControl = this.ctrlContainer.form.get(this.name);
    this.formControl.setValidators(Validators.min(0));

    if (this.formControl.value) {
      this.setInitialValues(this.formControl.value);
    }
  }

  setInitialValues(value: any) {
    this.initialValue = value;
    this.unlimited = value === UNLIMITED;
    this.onChange();
  }
}
