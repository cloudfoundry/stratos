import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface TailwindJsonSchemaFormConfig {
  addSubmit?: boolean;
}

@Component({
  selector: 'json-schema-form',
  templateUrl: './tailwind-json-schema-form.component.html',
  styleUrls: ['./tailwind-json-schema-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class TailwindJsonSchemaFormComponent implements OnInit {
  @Input() schema: any;
  @Input() data: any;
  @Input() framework: string = 'tailwind';
  @Input() options: TailwindJsonSchemaFormConfig = { addSubmit: false };
  @Input() loadExternalAssets: boolean = false;

  @Output() onChanges = new EventEmitter<any>();
  @Output() validationErrors = new EventEmitter<any[]>();

  form: UntypedFormGroup;
  formFields: any[] = [];
  formData: any = {};

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit() {
    this.buildForm();
    if (this.data) {
      this.form.patchValue(this.data);
      this.formData = { ...this.data };
    }
  }

  ngOnChanges() {
    if (this.schema) {
      this.buildForm();
      if (this.data) {
        this.form.patchValue(this.data);
        this.formData = { ...this.data };
      }
    }
  }

  private buildForm() {
    if (!this.schema || !this.schema.properties) {
      this.form = this.fb.group({});
      this.formFields = [];
      return;
    }

    const formGroup: any = {};
    this.formFields = [];

    Object.keys(this.schema.properties).forEach(key => {
      const property = this.schema.properties[key];
      const isRequired = this.schema.required && this.schema.required.includes(key);

      let validators = [];
      if (isRequired) {
        validators.push(Validators.required);
      }

      const control = new UntypedFormControl('', validators);
      formGroup[key] = control;

      this.formFields.push({
        key,
        property,
        required: isRequired,
        control
      });
    });

    this.form = this.fb.group(formGroup);

    // Subscribe to form changes
    this.form.valueChanges.subscribe(value => {
      this.formData = value;
      this.onChanges.emit(value);
      this.checkValidation();
    });
  }

  private checkValidation() {
    const errors: any[] = [];

    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.controls[key];
      if (control.invalid && control.errors) {
        Object.keys(control.errors).forEach(errorKey => {
          errors.push({
            dataPath: `/${key}`,
            message: this.getErrorMessage(errorKey, key)
          });
        });
      }
    });

    this.validationErrors.emit(errors);
  }

  private getErrorMessage(errorKey: string, fieldKey: string): string {
    switch (errorKey) {
      case 'required':
        return `${fieldKey} is required`;
      default:
        return `${fieldKey} is invalid`;
    }
  }

  getFieldType(property: any): string {
    switch (property.type) {
      case 'string':
        return property.format === 'password' ? 'password' : 'text';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'checkbox';
      default:
        return 'text';
    }
  }

  isTextarea(property: any): boolean {
    return property.type === 'string' && (
      property.format === 'textarea' ||
      property.maxLength > 100 ||
      property.description?.includes('multiline')
    );
  }

  isSelect(property: any): boolean {
    return property.enum && property.enum.length > 0;
  }
}