import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, ControlContainer, FormGroupDirective, Validators } from '@angular/forms';

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
  ]
})
export class UnlimitedInputComponent implements OnInit {

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

  constructor(public ctrlContainer: FormGroupDirective) { }

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

  setInitialValues(value) {
    this.initialValue = value;
    this.unlimited = value === UNLIMITED;
    this.onChange();
  }
}
