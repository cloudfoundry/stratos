import { Component, EventEmitter, Input, type OnInit, Output, inject, ChangeDetectionStrategy } from '@angular/core';
import { Validators, ReactiveFormsModule, FormBuilder, FormControl, type FormGroup } from '@angular/forms';


export interface TailwindJsonSchemaFormConfig {
  addSubmit?: boolean;
}

interface SchemaProperty {
  type?: string;
  format?: string;
  maxLength?: number;
  description?: string;
  enum?: unknown[];
}

interface JsonSchema {
  properties?: Record<string, SchemaProperty>;
  required?: string[];
}

@Component({
  selector: 'json-schema-form',
  templateUrl: './tailwind-json-schema-form.component.html',
  styleUrls: ['./tailwind-json-schema-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule
]
})
export class TailwindJsonSchemaFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input() schema: JsonSchema;
  @Input() data: Record<string, unknown>;
  @Input() framework: string = 'tailwind';
  @Input() options: TailwindJsonSchemaFormConfig = { addSubmit: false };
  @Input() loadExternalAssets: boolean = false;

  @Output() onChanges = new EventEmitter<unknown>();
  @Output() validationErrors = new EventEmitter<unknown[]>();

  form!: FormGroup;
  formFields: Array<{
    key: string;
    property: SchemaProperty;
    required: boolean;
    control: FormControl;
  }> = [];
  formData: Record<string, unknown> = {};

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

    const formGroup: Record<string, FormControl> = {};
    this.formFields = [];

    Object.keys(this.schema.properties).forEach(key => {
      const property = this.schema.properties?.[key];
      if (!property) {
        return;
      }
      const isRequired = this.schema.required?.includes(key) ?? false;

      const validators = [];
      if (isRequired) {
        validators.push(Validators.required);
      }

      const control = new FormControl('', validators);
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
    const errors: unknown[] = [];

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

  getFieldType(property: SchemaProperty): string {
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

  isTextarea(property: SchemaProperty): boolean {
    return property.type === 'string' && (
      property.format === 'textarea' ||
      (property.maxLength !== undefined && property.maxLength > 100) ||
      property.description?.includes('multiline') === true
    );
  }

  isSelect(property: SchemaProperty): boolean {
    return property.enum !== undefined && property.enum.length > 0;
  }
}